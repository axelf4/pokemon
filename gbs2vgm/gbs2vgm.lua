#!/usr/bin/env luajit
-- Converter from GBS to VGM.
--
-- See: https://vgmrips.net/wiki/VGM_Specification

local argparse = require "argparse"
local binaryheap = require "binaryheap"
local bit = require "bit"
local bor, band, rshift = bit.bor, bit.band, bit.rshift

function map(f, array)
   local res = {}
   for i, v in ipairs(array) do
	  res[i] = f(v)
   end
   return res
end

function leu16(u)
   return band(u, 0xFF), rshift(band(u, 0xFF00), 8)
end

function leu32(u)
   return band(u, 0xFF), band(rshift(u, 8), 0xFF),
	  band(rshift(u, 16), 0xFF), band(rshift(u, 24), 0xFF)
end

local cpuRate, samplingRate = 4194304, 44100
local s60th = 735 -- Number of samples in 60th of a second
local s50th = 882 -- Number of samples in 50th of a second

local args
do
   local parser = argparse("gbs2vgm", "Converts GBS files to VGM.")
   parser:argument("file", "Input GBS file.")
   parser:option("-N --subsong", "The subsong from the sound file to convert.", "1")
	  :convert(tonumber)
   parser:option("--intro-duration", "Duration of intro in seconds", "0")
	  :convert(tonumber)
   parser:mutex(
	  parser:option("--loop-duration", "Duration of loop in seconds", "0")
	  :convert(tonumber),
	  parser:flag "--no-header"
   )
   args = parser:parse()
end

local introDuration, loopDuration = args.intro_duration, args.loop_duration

local out = assert(io.open("out.vgm", "wb"))
-- Write header
local loopNumSamplesBin = { leu32(samplingRate * loopDuration) }
local header = {
   string.byte("V"), string.byte("g"), string.byte("m"), string.byte(" "),
   0, 0, 0, 0, -- EOF offset (gets written afterward)
   0x71, 0x01, 0x00, 0x00, -- Version number
   0, 0, 0, 0,
   0, 0, 0, 0, 0, 0, 0, 0,
   0, 0, 0, 0, -- Total NR samples (gets written afterward)
   0, 0, 0, 0, -- Loop offset
   loopNumSamplesBin[1], loopNumSamplesBin[2], loopNumSamplesBin[3], loopNumSamplesBin[4], -- Loop #samples
   0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
   0, 0, 0, 0,
   0x84 - 0x34, 0, 0, 0, -- VGM data offset
   0, 0, 0, 0, 0, 0, 0, 0,
   0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
   0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
   0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
   0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
   leu32(4194304) -- GB DMG clock
}
if not args.no_header then
   out:write(table.concat(map(string.char, header)))
end

local function writeLoopOffset()
   local prevPos = out:seek()
   out:seek("set", 0x1C)
   out:write(string.char(leu32(prevPos - 0x1C)))
   out:seek("set", prevPos)
end

--- Returns string of commands for waiting `i` samples.
local function waitCommands(i)
   if i == 0 then return "" end

   -- Use uniform-cost search
   local function lt(a, b) return #(a[2]) < #(b[2]) end
   local frontier = binaryheap.minHeap(lt)
   frontier:insert({i, ""})
   while true do
	  local rem, partialCmd = unpack(frontier:pop())
	  if rem == 0 then return partialCmd end

	  -- APU does not support 0x63
	  -- if s50th <= rem then
	  -- 	frontier:insert({ rem - s50th, partialCmd .. string.char(0x63) })
	  -- end
	  if s60th <= rem then
		 frontier:insert({ rem - s60th, partialCmd .. string.char(0x62) })
	  end
	  do
		 local n = math.min(16, rem) - 1
		 frontier:insert({ rem - (n + 1), partialCmd .. string.char(bor(0x70, n)) })
	  end
	  do
		 local n = math.min(0xFFFF, rem)
		 frontier:insert({ rem - n, partialCmd .. string.char(0x61, leu16(n)) })
	  end
   end
end

local f = io.popen("gbsplay -o iodumper " .. args.file
				   .. " " .. args.subsong .. " " .. args.subsong
				   .. " -T 0 -f 0 -t " .. math.ceil(introDuration + loopDuration))
local sampleCount = 0
local hasWrittenLoopPoint = false
local cmdCount = 0
for line in f:lines() do
   local offset, reg, val = string.match(line, "(%x%x%x%x%x%x%x%x) ff(%x%x)=(%x%x)")
   if not offset then goto continue end
   samples = math.floor(tonumber(offset, 16) / (cpuRate / samplingRate)) -- Convert cycles to samples
   reg, val = tonumber(reg, 16), tonumber(val, 16)

   sampleCount = sampleCount + samples
   cmdCount = cmdCount + 1
   if loopDuration > 0
	  and sampleCount - (cmdCount * samplingRate / cpuRate)
	  >= introDuration * samplingRate
	  and not hasWrittenLoopPoint then
	  writeLoopOffset()
	  hasWrittenLoopPoint = true
   end
   out:write(waitCommands(samples))

   if 0x10 <= reg and reg <= 0x3F then
	  -- Note: Register 00 equals GameBoy address FF10
	  out:write(string.char(0xB3, reg - 0x10, val))
   end

   if sampleCount - (cmdCount * samplingRate / cpuRate)
	  >= (introDuration + loopDuration) * samplingRate then
	  break
   end

   ::continue::
end
f:close()
-- out:write(string.char(0x66)) -- End of sound data

if not args.no_header then
   -- Write EOF offset
   local len = out:seek()
   out:seek("set", 0x04)
   out:write(string.char(leu32(len - 0x04)))
   -- Write total NR of samples
   out:seek("set", 0x18)
   out:write(string.char(leu32(sampleCount)))
   out:close()
end

print("Total number of samples: ", sampleCount)

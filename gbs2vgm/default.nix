{ lib, stdenv, makeWrapper, luajit, gbsplay, vorbis-tools, python3 }: stdenv.mkDerivation {
  name = "gbs2vgm";

  src = ./.;

  nativeBuildInputs = [ makeWrapper ];
  buildInputs = [
    gbsplay
    (luajit.withPackages (ps: with ps; [ argparse binaryheap ]))

    (python3.withPackages (ps: with ps; [ numpy pysoundfile scipy matplotlib ]))
  ];

  postConfigure = ''
    substituteInPlace gbs2vgm.lua --replace 'gbsplay' '${gbsplay}/bin/gbsplay'
  '';

  installPhase = ''
    mkdir -p $out/bin
    cp gbs2vgm.lua $out/bin/gbs2vgm

    cp loop-searcher.py $out/bin/loop-searcher
    chmod +x $out/bin/loop-searcher

    makeWrapper ${./gbs2ogg} $out/bin/gbs2ogg \
      --prefix PATH : ${lib.makeBinPath [ gbsplay vorbis-tools ]}
  '';
}

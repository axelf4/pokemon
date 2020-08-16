{ pkgs ? import <nixpkgs> {} }: pkgs.mkShell {
	buildInputs = [ pkgs.nodejs-12_x ];
}

{
  description = "Nice game";

  inputs = {
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let pkgs = nixpkgs.legacyPackages.${system};
      in {
        devShell = pkgs.mkShell {
          buildInputs = with pkgs; [
            nodejs-14_x
            tiled

            (callPackage ./gbs2vgm {})
            gbsplay
          ];

          GBS_FILES = pkgs.callPackage extra/pokecrystal-gbs.nix {};
        };
      }
    );
}

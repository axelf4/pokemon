{ stdenv, fetchurl, rgbds, python3 }: stdenv.mkDerivation rec {
  pname = "pokecrystal-gbs";
  version = "20200427";

  src = fetchurl {
    url = "https://gitgud.io/zdxy/pokecrystal-gbs/-/archive/crystal-${version}/pokecrystal-gbs-crystal-${version}.tar.gz";
    sha256 = "EO7juxF+EnUvK2nvuVB8eAeQWVe5v0q91Mwnw00h1mQ=";
  };

  nativeBuildInputs = [ python3 ];

  makeFlags = [ "RGBDS=${rgbds}/bin/" "PYTHON=python3" ];

  installPhase = ''
    mkdir -p $out
    cp crystal{,_sfx}.gbs $out
  '';
}

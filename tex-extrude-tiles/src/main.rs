//! Adds a 1 pixel wide extruded border around tile set tiles.
//!
//! Fixes tile set texture bleeding.

use image::{DynamicImage, GenericImage, GenericImageView, PNG};
use std::env;
use std::fs::File;

fn main() {
    println!("Hello, world!");
    let mut args = env::args();
    args.next().unwrap(); // Skip binary name
    let filename = args.next().expect("Filename should be given as first arg");

    let mut img = image::open(filename).expect("Failed to load image");
    println!("dimensions {:?}", img.dimensions());
    let (w, h) = img.dimensions();

    let tile_size: u32 = args
        .next()
        .and_then(|s| s.parse().ok())
        .expect("Tile size should be second argument");

    assert!(w % tile_size == 0 && h % tile_size == 0);
    // Number of tiles on the horizontal and vertical, respectively
    let (n, m) = (w / tile_size, h / tile_size);

    let mut out = DynamicImage::new_rgba8(w + 2 * n, h + 2 * m);
    for (i, j) in (0..n).flat_map(|i| (0..m).map(move |j| (i, j))) {
        let (x, y) = (tile_size * i, tile_size * j);
        let (nx, ny) = (x + 2 * i + 1, y + 2 * j + 1);
        out.copy_from(&img.sub_image(x, y, tile_size, tile_size), nx, ny);

        out.copy_from(&img.sub_image(x, y, 1, 1), nx - 1, ny - 1); // Top-left corner
        out.copy_from(
            &img.sub_image(x + tile_size - 1, y, 1, 1),
            nx + tile_size,
            ny - 1,
        ); // Top-right corner
        out.copy_from(
            &img.sub_image(x, y + tile_size - 1, 1, 1),
            nx - 1,
            ny + tile_size,
        ); // Bottom-left corner
        out.copy_from(
            &img.sub_image(x + tile_size - 1, y + tile_size - 1, 1, 1),
            nx + tile_size,
            ny + tile_size,
        ); // Bottom-right corner

        out.copy_from(&img.sub_image(x, y, 1, tile_size), nx - 1, ny); // Left side
        out.copy_from(
            &img.sub_image(x + tile_size - 1, y, 1, tile_size),
            nx + tile_size,
            ny,
        ); // Right side
        out.copy_from(&img.sub_image(x, y, tile_size, 1), nx, ny - 1); // Top side
        out.copy_from(
            &img.sub_image(x, y + tile_size - 1, tile_size, 1),
            nx,
            ny + tile_size,
        ); // Bottom side
    }

    let mut output = File::create("extruded.png").unwrap();
    out.write_to(&mut output, PNG).unwrap();
}

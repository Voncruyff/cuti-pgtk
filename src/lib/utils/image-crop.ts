/**
 * Utilitas untuk memuat gambar, memotong (crop) berdasarkan koordinat piksel,
 * melakukan rotasi, dan mengompresi gambar di peramban agar selalu di bawah 1 MB.
 */

export interface PixelCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Memuat URL gambar ke objek HTMLImageElement
 */
export const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });

/**
 * Mengubah derajat sudut menjadi radian
 */
export function getRadianAngle(degreeValue: number): number {
  return (degreeValue * Math.PI) / 180;
}

/**
 * Menghitung ukuran kotak pembatas (bounding box) setelah gambar diputar
 */
export function calculateRotatedBox(width: number, height: number, rotation: number) {
  const rotRad = getRadianAngle(rotation);

  return {
    width:
      Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height:
      Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}

/**
 * Memotong dan merotasikan gambar dari canvas, kemudian mengompresinya
 * ke format WebP (atau JPEG) dengan ukuran pasti < 1 MB (1024 * 1024 bytes).
 *
 * @param imageSrc Sumber gambar (data URL / object URL)
 * @param pixelCrop Koordinat piksel pemotongan dari react-easy-crop
 * @param rotation Sudut rotasi dalam derajat (misal 0, 90, 180, 270)
 * @param fileName Nama berkas keluaran
 * @param targetDimension Dimensi hasil avatar persegi (default: 512x512 piksel)
 */
export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: PixelCrop,
  rotation = 0,
  fileName = "avatar-cropped.webp",
  targetDimension = 512
): Promise<File> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Gagal menginisialisasi 2D canvas context.");
  }

  const { width: bBoxWidth, height: bBoxHeight } = calculateRotatedBox(
    image.width,
    image.height,
    rotation
  );

  // Set ukuran canvas sebesar bounding box rotasi
  canvas.width = Math.floor(bBoxWidth);
  canvas.height = Math.floor(bBoxHeight);

  // Pindahkan titik poros (origin) ke tengah canvas untuk rotasi
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(getRadianAngle(rotation));
  ctx.translate(-image.width / 2, -image.height / 2);

  // Gambar gambar sumber ke canvas yang sudah diputar
  ctx.drawImage(image, 0, 0);

  // Canvas kedua untuk hasil cropping terfokus
  const croppedCanvas = document.createElement("canvas");
  const croppedCtx = croppedCanvas.getContext("2d");

  if (!croppedCtx) {
    throw new Error("Gagal menginisialisasi cropped canvas context.");
  }

  // Set ukuran avatar standar (misal 512x512)
  croppedCanvas.width = targetDimension;
  croppedCanvas.height = targetDimension;

  croppedCtx.imageSmoothingEnabled = true;
  croppedCtx.imageSmoothingQuality = "high";

  // Ambil area potongan dari canvas pertama ke canvas kedua
  croppedCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    targetDimension,
    targetDimension
  );

  // Target ukuran: di bawah 1 MB (1024 * 1024 bytes)
  const MAX_BYTES = 1024 * 1024;

  // Kompresi berulang jika diperlukan agar dipastikan < 1 MB
  return new Promise((resolve, reject) => {
    const tryCompress = (quality: number) => {
      croppedCanvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Gagal mengekspor kanvas gambar."));
            return;
          }

          // Jika ukuran melebihi 1 MB dan kualitas masih bisa dikurangi
          if (blob.size > MAX_BYTES && quality > 0.3) {
            tryCompress(quality - 0.15);
          } else {
            const cleanName = fileName.replace(/\.[^/.]+$/, "") + ".webp";
            const file = new File([blob], cleanName, {
              type: "image/webp",
              lastModified: Date.now(),
            });
            resolve(file);
          }
        },
        "image/webp",
        quality
      );
    };

    // Mulai kompresi dengan kualitas 0.88 (kualitas prima & ukuran berkas sekitar 40-100 KB)
    tryCompress(0.88);
  });
}

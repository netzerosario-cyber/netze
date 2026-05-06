'use client';
// ============================================================
// components/PhotoGallery.tsx — Galería con lightbox integrado
// ============================================================
import { useState } from 'react';
import Image from 'next/image';
import Lightbox from './Lightbox';

interface Photo {
  image: string;
  thumb?: string;
  original?: string;
  is_front_photo?: boolean;
}

interface PhotoGalleryProps {
  photos: Photo[];
  title: string;
}

export default function PhotoGallery({ photos, title }: PhotoGalleryProps) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  if (photos.length === 0) {
    return (
      <div className="aspect-[16/9] bg-gray-100 rounded-2xl flex flex-col items-center justify-center gap-2 text-gray-400">
        <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5M4.5 3h15A1.5 1.5 0 0121 4.5v15A1.5 1.5 0 0119.5 21H4.5A1.5 1.5 0 013 19.5v-15A1.5 1.5 0 014.5 3z" />
        </svg>
        <p className="text-sm">Sin fotos disponibles</p>
      </div>
    );
  }

  const main   = photos[0];
  const thumbs = photos.slice(1, 5);
  const lightboxImages = photos.map(p => ({ src: p.original ?? p.image, alt: title }));

  return (
    <>
      <div className="flex flex-col gap-2">
        {/* Foto principal — click para lightbox */}
        <div
          className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-gray-100 shadow-md cursor-pointer group"
          onClick={() => setLightboxIdx(0)}
        >
          <Image
            src={main.image}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, 800px"
            className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
            priority
          />
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
            <div className="bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#374151" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
              </svg>
              <span className="text-xs font-semibold text-gray-700">Ver fotos</span>
            </div>
          </div>
          {photos.length > 1 && (
            <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159M3.75 21h16.5" />
              </svg>
              {photos.length} fotos
            </div>
          )}
        </div>

        {/* Thumbnails */}
        {thumbs.length > 0 && (
          <div className="grid grid-cols-4 gap-2">
            {thumbs.map((ph, i) => (
              <div
                key={i}
                className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 cursor-pointer group"
                onClick={() => setLightboxIdx(i + 1)}
              >
                <Image
                  src={ph.thumb ?? ph.image}
                  alt={`Foto ${i + 2}`}
                  fill
                  sizes="200px"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {i === 3 && photos.length > 5 && (
                  <div className="absolute inset-0 bg-black/55 flex items-center justify-center text-white text-sm font-bold hover:bg-black/40 transition-colors">
                    +{photos.length - 5}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <Lightbox
          images={lightboxImages}
          initialIndex={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
        />
      )}
    </>
  );
}

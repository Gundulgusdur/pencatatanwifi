"use client";

/**
 * Modal — komponen dialog sederhana dan reusable.
 *
 * Alur:
 * 1. Jika `open` false → tidak render apa pun (return null).
 * 2. Jika true → render satu overlay gelap yang juga jadi pembungkus konten.
 *    Konten modal adalah ANAK dari overlay, jadi selalu tampil di atas latar.
 * 3. Klik di area gelap (overlay) → memanggil onClose.
 *    Klik di dalam konten → stopPropagation agar modal tidak tertutup.
 * 4. Tekan Escape → memanggil onClose.
 */
import { useEffect } from "react";

type ModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export default function Modal({
  open,
  title,
  onClose,
  children,
  footer,
}: ModalProps) {
  // Tutup modal saat tombol Escape ditekan.
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="pw-modal-overlay" onClick={onClose}>
      <div
        className="pw-modal-content"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pw-modal-header">
          <h5 className="mb-0">{title}</h5>
          <button
            type="button"
            className="btn-close"
            aria-label="Tutup"
            onClick={onClose}
          />
        </div>

        <div className="pw-modal-body">{children}</div>

        {footer && <div className="pw-modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

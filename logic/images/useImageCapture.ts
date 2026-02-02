
import React from 'react';
import { AppView } from '../../types';

interface UseImageCaptureProps {
  setCapturedImage: (img: string | null) => void;
  setView: (view: AppView) => void;
}

export const useImageCapture = ({ setCapturedImage, setView }: UseImageCaptureProps) => {
  const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setCapturedImage(reader.result as string);
      setView('player_home');
    };
    reader.readAsDataURL(file);
  };

  return { handleImageCapture };
};

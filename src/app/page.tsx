'use client';

import { useState } from 'react';

type ImageOption = {
  width: string;
  height: string;
  quality: string;
  format: string;
};

type ProcessedImage = {
  originalName: string;
  filename: string;
  tempPath: string;
};

export default function ImageBatchTestPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [options, setOptions] = useState<ImageOption[]>([]);
  const [processed, setProcessed] = useState<ProcessedImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    setFiles(selected);
    setOptions(
      selected.map(() => ({
        width: '',
        height: '',
        quality: '',
        format: 'jpeg',
      }))
    );
    setProcessed([]);
    setError(null);
  };

  const handleOptionChange = (index: number, field: keyof ImageOption, value: string) => {
    const updated = [...options];
    updated[index][field] = value;
    setOptions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setProcessed([]);

    const formData = new FormData();
    files.forEach((file) => formData.append('images', file));
    formData.append('options', JSON.stringify(options));

    try {
      const res = await fetch('/api/image-batch', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || 'Something went wrong');
      }

      setProcessed(data.images || []);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else if (typeof err === 'string') {
        setError(err);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">🧪 Image Optimizer Test Page</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-2 font-medium text-gray-700">Select Images</label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            className="block w-full text-sm border border-gray-300 rounded-md file:mr-4 file:py-2 file:px-4 file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700"
          />
        </div>

        {files.map((file, idx) => (
          <div key={idx} className="p-4 border rounded-lg bg-white shadow-md space-y-2">
            <div className="flex items-center gap-4">
              <img
                src={URL.createObjectURL(file)}
                alt="Preview"
                className="w-32 h-32 object-cover rounded-md border"
              />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium">Width</label>
                  <input
                    type="number"
                    value={options[idx]?.width}
                    onChange={(e) => handleOptionChange(idx, 'width', e.target.value)}
                    className="w-24 border rounded px-2 py-1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Height</label>
                  <input
                    type="number"
                    value={options[idx]?.height}
                    onChange={(e) => handleOptionChange(idx, 'height', e.target.value)}
                    className="w-24 border rounded px-2 py-1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Quality</label>
                  <input
                    type="number"
                    value={options[idx]?.quality}
                    onChange={(e) => handleOptionChange(idx, 'quality', e.target.value)}
                    className="w-24 border rounded px-2 py-1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Format</label>
                  <select
                    value={options[idx]?.format}
                    onChange={(e) => handleOptionChange(idx, 'format', e.target.value)}
                    className="w-24 border rounded px-2 py-1"
                  >
                    <option value="jpeg">jpeg</option>
                    <option value="png">png</option>
                    <option value="webp">webp</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        ))}

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Submit & Optimize'}
        </button>
      </form>

      {error && <div className="text-red-600 font-semibold">{error}</div>}

      {processed.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl font-bold mb-4">✅ Optimized Images</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {processed.map((img, idx) => (
              <div key={idx} className="p-4 border rounded shadow-sm bg-white space-y-2">
                <div className="text-sm text-gray-500">{img.originalName}</div>
                <img
                  src={`/api/image-preview?path=${encodeURIComponent(img.tempPath)}`}
                  alt={`Processed ${idx}`}
                  className="w-full object-cover rounded-md"
                />
                <code className="text-xs break-all text-gray-400">{img.tempPath}</code>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

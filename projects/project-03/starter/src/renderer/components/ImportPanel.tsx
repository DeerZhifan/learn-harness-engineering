import { useState } from 'react';

interface Props {
  onImport: (filePath: string) => void;
}

export function ImportPanel({ onImport }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePick = async () => {
    setError(null);
    setBusy(true);
    try {
      const filePath = await window.knowledgeBase.documents.pickFile();
      if (filePath) {
        onImport(filePath);
      }
    } catch (err) {
      console.error('File pick failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to open file picker');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{
      padding: '20px',
      background: '#16213e',
      borderRadius: '6px',
      border: '1px dashed #0f3460',
      textAlign: 'center',
      color: '#888',
    }}>
      <div style={{ fontSize: '14px', marginBottom: '8px', color: '#c0c0e0' }}>
        Import Documents
      </div>
      <div style={{ fontSize: '12px', marginBottom: '12px' }}>
        Supported: .txt, .md files
      </div>
      <button
        type="button"
        onClick={handlePick}
        disabled={busy}
        style={{
          padding: '8px 18px',
          background: '#533483',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: busy ? 'wait' : 'pointer',
          fontSize: '13px',
        }}
      >
        {busy ? 'Opening...' : 'Choose File'}
      </button>
      {error && (
        <div style={{ marginTop: '10px', fontSize: '12px', color: '#d9534f' }}>{error}</div>
      )}
    </div>
  );
}

interface Props {
  onImport: () => void;
}

export function ImportPanel({ onImport }: Props) {
  return (
    <div style={{
      padding: '20px',
      background: '#16213e',
      borderRadius: '6px',
      border: '1px dashed #0f3460',
      textAlign: 'center',
      color: '#888',
    }}>
      <div style={{ fontSize: '14px', marginBottom: '8px' }}>Import Documents</div>
      <div style={{ fontSize: '12px', marginBottom: '10px' }}>
        Click below to choose a file. Supported: .txt, .md
      </div>
      <button
        onClick={onImport}
        style={{
          padding: '6px 14px',
          background: '#533483',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '12px',
        }}
      >
        Choose File…
      </button>
    </div>
  );
}

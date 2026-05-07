import { AppStatus } from '../../shared/types';

const STATUS_COLOR: Record<AppStatus['indexStatus'], string> = {
  idle: '#888',
  indexing: '#f0ad4e',
  ready: '#5cb85c',
  error: '#d9534f',
};

const STATUS_LABEL: Record<AppStatus['indexStatus'], string> = {
  idle: 'Idle',
  indexing: 'Indexing...',
  ready: 'Ready',
  error: 'Error',
};

interface Props {
  status: AppStatus;
}

export function StatusBar({ status }: Props) {
  const statusColor = STATUS_COLOR[status.indexStatus];

  return (
    <div style={{
      padding: '4px 20px',
      background: '#0f1729',
      borderTop: '1px solid #0f3460',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      fontSize: '11px',
      color: '#888',
    }}>
      <span>
        <span style={{
          display: 'inline-block',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: statusColor,
          marginRight: '6px',
        }} />
        Index: {STATUS_LABEL[status.indexStatus]}
      </span>
      <span>Documents: {status.documentsLoaded}</span>
      <span>Indexed: {status.indexedCount}/{status.documentsLoaded}</span>
      <span>Chunks: {status.totalChunks}</span>
      {status.lastActivity && (
        <span>Last activity: {new Date(status.lastActivity).toLocaleTimeString()}</span>
      )}
    </div>
  );
}

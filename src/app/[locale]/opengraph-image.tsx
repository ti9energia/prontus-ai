import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Auronis Health — Menos documentação. Mais medicina.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '72px 80px',
          background: 'linear-gradient(135deg, #090B0F 0%, #171A21 55%, #0a5651 100%)',
          color: '#F6F8FA',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', fontSize: 30, fontWeight: 700, letterSpacing: 3 }}>
          AURONIS{'  '}
          <span style={{ color: '#22d3ee', marginLeft: 12 }}>HEALTH</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 30 }}>
          <div style={{ fontSize: 66, fontWeight: 800, lineHeight: 1.04 }}>Termine a consulta.</div>
          <div style={{ fontSize: 66, fontWeight: 800, lineHeight: 1.04, color: '#22d3ee' }}>
            A Mari faz o resto.
          </div>
        </div>
        <div style={{ display: 'flex', fontSize: 27, color: '#9aa6b4', marginTop: 28, maxWidth: 920 }}>
          Inteligência clínica que vira prontuário e documentação em segundos — menos glosa, mais
          tempo com o paciente.
        </div>
      </div>
    ),
    { ...size },
  );
}

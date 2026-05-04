export default function LoadingLogo({ size = 80 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size}>
      <style>{`
        @keyframes lb-logo-intro {
          0%   { opacity: 0; transform: rotate(0deg) scale(0.45); }
          30%  { opacity: 1; transform: rotate(0deg) scale(1.1);  }
          44%  { opacity: 1; transform: rotate(0deg) scale(1);    }
          80%  {             transform: rotate(52deg) scale(1);   }
          100% {             transform: rotate(45deg) scale(1);   }
        }
        @keyframes lb-bite-reveal {
          from { opacity: 0; transform: scale(0); }
          to   { opacity: 1; transform: scale(1); }
        }
        .lb-lg-rot {
          transform-origin: 32px 32px;
          animation: lb-logo-intro 1s cubic-bezier(0.4, 0, 0.2, 1) both;
        }
        .lb-lg-bite {
          transform-box: fill-box;
          transform-origin: center;
          animation: lb-bite-reveal 0.22s cubic-bezier(0.34, 1.56, 0.64, 1) 1.2s both;
        }
      `}</style>

      <rect width="64" height="64" rx="12" fill="#f8f4ed" />

      <g className="lb-lg-rot">
        <g transform="translate(33, 37) scale(0.82) translate(-32, -28.5)">
          <path
            d="M32 52 C20 40 6 32 6 20 C6 11 13 5 20 5 C25 5 29 8 32 12 C35 8 39 5 44 5 C51 5 58 11 58 20 C58 32 44 40 32 52Z"
            fill="#6b1f2a"
          />
          <g className="lb-lg-bite">
            <circle cx="56" cy="12" r="6" fill="#f8f4ed" />
            <circle cx="55" cy="18" r="6" fill="#f8f4ed" />
            <circle cx="57" cy="24" r="6" fill="#f8f4ed" />
          </g>
        </g>
      </g>
    </svg>
  )
}

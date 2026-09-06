export default function GlassFilters() {
  return (
    <svg
      className="pointer-events-none absolute h-0 w-0"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <filter
          id="editorial-refraction"
          x="-10%"
          y="-10%"
          width="120%"
          height="120%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.012 0.028"
            numOctaves="2"
            seed="8"
            result="grain"
          />
          <feGaussianBlur in="grain" stdDeviation="2" result="lens" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="lens"
            scale="9"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );
}

import { useLayoutEffect, useRef, useState } from 'react';
import './MarqueeBanner.css';

type Props = {
  text: string;
  reverse?: boolean;
  repeat?: number;
};

/** Pure-CSS infinite marquee: two identical groups translated by -50% for a seamless loop. */
export default function MarqueeBanner({ text, reverse = false, repeat = 6 }: Props) {
  const bannerRef = useRef<HTMLDivElement>(null);
  const [itemCount, setItemCount] = useState(repeat);

  useLayoutEffect(() => {
    const banner = bannerRef.current;
    const item = banner?.querySelector<HTMLElement>('.marquee__item');
    if (!banner || !item) return;

    const fillBanner = () => {
      const itemWidth = item.getBoundingClientRect().width;
      if (itemWidth <= 0) return;
      // Each half must cover the banner, with an even count to preserve
      // the alternating outline colours across both loop boundaries.
      const needed = Math.ceil(banner.clientWidth / itemWidth) + 1;
      setItemCount(Math.ceil(Math.max(repeat, needed) / 2) * 2);
    };
    const observer = new ResizeObserver(fillBanner);
    observer.observe(banner);
    observer.observe(item);
    fillBanner();
    return () => observer.disconnect();
  }, [text, repeat]);

  const items = Array.from({ length: itemCount }, (_, i) => (
    <span className="marquee__item" key={i}>
      {text} -
    </span>
  ));

  return (
    <div ref={bannerRef} className={`marquee ${reverse ? 'marquee--reverse' : ''}`} aria-hidden="true">
      <div className="marquee__track">
        <div className="marquee__group">{items}</div>
        <div className="marquee__group">{items}</div>
      </div>
    </div>
  );
}

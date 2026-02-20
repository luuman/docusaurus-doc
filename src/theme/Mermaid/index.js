import React, {useEffect, useRef, useState, useCallback} from 'react';
import ErrorBoundary from '@docusaurus/ErrorBoundary';
import {ErrorBoundaryErrorMessageFallback} from '@docusaurus/theme-common';
import {
  MermaidContainerClassName,
  useMermaidRenderResult,
} from '@docusaurus/theme-mermaid/client';
import styles from './styles.module.css';

function MermaidRenderResult({renderResult}) {
  const ref = useRef(null);
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [translate, setTranslate] = useState({x: 0, y: 0});
  const dragStart = useRef({x: 0, y: 0, tx: 0, ty: 0});

  useEffect(() => {
    const div = ref.current;
    renderResult.bindFunctions?.(div);
  }, [renderResult]);

  const handleZoomIn = useCallback((e) => {
    e.stopPropagation();
    setScale((s) => Math.min(s + 0.25, 3));
  }, []);

  const handleZoomOut = useCallback((e) => {
    e.stopPropagation();
    setScale((s) => Math.max(s - 0.25, 0.25));
  }, []);

  const handleReset = useCallback((e) => {
    e.stopPropagation();
    setScale(1);
    setTranslate({x: 0, y: 0});
  }, []);

  const handleFullscreen = useCallback(() => {
    setIsFullscreen((v) => !v);
    setScale(1);
    setTranslate({x: 0, y: 0});
  }, []);

  const handleWheel = useCallback((e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setScale((s) => Math.min(Math.max(s + delta, 0.25), 3));
    }
  }, []);

  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStart.current = {x: e.clientX, y: e.clientY, tx: translate.x, ty: translate.y};
  }, [translate]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setTranslate({x: dragStart.current.tx + dx, y: dragStart.current.ty + dy});
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
      const handleEsc = (e) => {
        if (e.key === 'Escape') handleFullscreen();
      };
      document.addEventListener('keydown', handleEsc);
      return () => {
        document.body.style.overflow = '';
        document.removeEventListener('keydown', handleEsc);
      };
    }
  }, [isFullscreen, handleFullscreen]);

  return (
    <>
      <div
        ref={containerRef}
        className={`${styles.wrapper} ${isFullscreen ? styles.fullscreen : ''}`}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div className={styles.toolbar}>
          <button className={styles.toolBtn} onClick={handleZoomOut} title="缩小">−</button>
          <span className={styles.scaleLabel}>{Math.round(scale * 100)}%</span>
          <button className={styles.toolBtn} onClick={handleZoomIn} title="放大">+</button>
          <button className={styles.toolBtn} onClick={handleReset} title="重置">↺</button>
          <button className={styles.toolBtn} onClick={handleFullscreen} title={isFullscreen ? '退出全屏' : '全屏'}>
            {isFullscreen ? '✕' : '⛶'}
          </button>
        </div>
        <div
          className={styles.svgArea}
          style={{
            transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
            cursor: isDragging ? 'grabbing' : 'grab',
          }}
        >
          <div
            ref={ref}
            className={`${MermaidContainerClassName} ${styles.container}`}
            dangerouslySetInnerHTML={{__html: renderResult.svg}}
          />
        </div>
      </div>
      {isFullscreen && <div className={styles.overlay} onClick={handleFullscreen} />}
    </>
  );
}

function MermaidRenderer({value}) {
  const renderResult = useMermaidRenderResult({text: value});
  if (renderResult === null) {
    return null;
  }
  return <MermaidRenderResult renderResult={renderResult} />;
}

export default function Mermaid(props) {
  return (
    <ErrorBoundary
      fallback={(params) => <ErrorBoundaryErrorMessageFallback {...params} />}>
      <MermaidRenderer {...props} />
    </ErrorBoundary>
  );
}

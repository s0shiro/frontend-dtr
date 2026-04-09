'use client';

import { useEffect, useMemo, useRef } from 'react';
import maplibregl from 'maplibre-gl';

import type { DeviceLocation } from '@/lib/geolocation';
import { useTheme } from '@/providers/ThemeProvider';

interface LiveProximityMapProps {
  officeLocation: DeviceLocation;
  userLocation: DeviceLocation | null;
}

const LIGHT_STYLE_URL = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';
const DARK_STYLE_URL = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

function createMarkerElement(type: 'office' | 'user') {
  const wrapper = document.createElement('div');
  wrapper.className = 'pointer-events-none flex flex-col items-center';

  const label = document.createElement('div');
  label.className = 'mb-1 rounded border border-control bg-surface-100 px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider text-light shadow-sm';
  label.textContent = type === 'office' ? 'Office' : 'You';

  const markerShell = document.createElement('div');
  markerShell.className = 'relative flex size-4 items-center justify-center';

  const pulse = document.createElement('span');
  pulse.className = type === 'office'
    ? 'absolute inline-flex size-4 animate-ping rounded-full bg-brand/40'
    : 'absolute inline-flex size-4 animate-ping rounded-full bg-warning/40';

  const dot = document.createElement('span');
  dot.className = type === 'office'
    ? 'relative inline-flex size-2.5 rounded-full bg-brand ring-2 ring-surface-100 shadow-sm'
    : 'relative inline-flex size-2.5 rounded-full bg-warning ring-2 ring-surface-100 shadow-sm';

  markerShell.appendChild(pulse);
  markerShell.appendChild(dot);
  wrapper.appendChild(label);
  wrapper.appendChild(markerShell);

  return wrapper;
}

export function LiveProximityMap({ officeLocation, userLocation }: LiveProximityMapProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const mapStyle = useMemo(() => (isDark ? DARK_STYLE_URL : LIGHT_STYLE_URL), [isDark]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const officeMarkerRef = useRef<maplibregl.Marker | null>(null);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: mapStyle,
      center: [officeLocation.longitude, officeLocation.latitude],
      zoom: 16,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    mapRef.current = map;

    return () => {
      officeMarkerRef.current?.remove();
      userMarkerRef.current?.remove();
      map.remove();
      mapRef.current = null;
      officeMarkerRef.current = null;
      userMarkerRef.current = null;
    };
  }, [mapStyle, officeLocation.latitude, officeLocation.longitude]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    if (!officeMarkerRef.current) {
      officeMarkerRef.current = new maplibregl.Marker({
        element: createMarkerElement('office'),
      })
        .setLngLat([officeLocation.longitude, officeLocation.latitude])
        .addTo(map);
    } else {
      officeMarkerRef.current.setLngLat([officeLocation.longitude, officeLocation.latitude]);
    }

    if (userLocation) {
      if (!userMarkerRef.current) {
        userMarkerRef.current = new maplibregl.Marker({
          element: createMarkerElement('user'),
        })
          .setLngLat([userLocation.longitude, userLocation.latitude])
          .addTo(map);
      } else {
        userMarkerRef.current.setLngLat([userLocation.longitude, userLocation.latitude]);
      }

      const bounds = new maplibregl.LngLatBounds()
        .extend([officeLocation.longitude, officeLocation.latitude])
        .extend([userLocation.longitude, userLocation.latitude]);

      map.fitBounds(bounds, {
        padding: 48,
        maxZoom: 16,
        duration: 500,
      });
      return;
    }

    userMarkerRef.current?.remove();
    userMarkerRef.current = null;

    map.easeTo({
      center: [officeLocation.longitude, officeLocation.latitude],
      zoom: 16,
      duration: 500,
    });
  }, [officeLocation.latitude, officeLocation.longitude, userLocation]);

  return (
    <div className="w-full overflow-hidden rounded-md border border-control bg-surface-200">
      <div ref={containerRef} className="h-56 w-full" aria-label="Office and live location map" />
    </div>
  );
}

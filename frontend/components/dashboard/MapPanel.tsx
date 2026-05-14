"use client";

import clsx from "clsx";
import maplibregl, { type GeoJSONSource, type Map as MapLibreMap } from "maplibre-gl";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Feature, FeatureCollection, LineString, Point } from "geojson";

import type { CityAllocation, ScenarioPayload } from "@/lib/domain";
import { formatMw, formatTemp } from "@/lib/format";
import { useDashboardStore } from "@/lib/store/dashboard-store";
import { PanelHeader } from "@/components/dashboard/PanelHeader";

const colorMap = {
  cyan: "#2563eb",
  emerald: "#059669",
  purple: "#7c3aed",
};

const baseMapStyle: maplibregl.StyleSpecification = {
  version: 8,
  glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
  sources: {
    carto: {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
        "https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
        "https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
    },
  },
  layers: [
    {
      id: "carto-light",
      type: "raster",
      source: "carto",
      paint: {
        "raster-opacity": 0.96,
        "raster-saturation": -0.18,
        "raster-contrast": 0.08,
      },
    },
  ],
};

type CityFeatureProps = {
  id: string;
  name: string;
  kind: "source" | "sink";
  color: string;
  heatMw: number;
  selected: boolean;
};

type FlowFeatureProps = {
  color: string;
  width: number;
};

type LabelPosition = {
  id: string;
  name: string;
  heatMw: number;
  kind: CityAllocation["kind"];
  selected: boolean;
  x: number;
  y: number;
};

// Converts dashboard city data into map point features.
function buildCityFeatures(
  cities: CityAllocation[],
  selectedCityId: string,
): FeatureCollection<Point, CityFeatureProps> {
  return {
    type: "FeatureCollection",
    features: cities.map((city) => ({
      type: "Feature",
      properties: {
        id: city.id,
        name: city.name,
        kind: city.kind,
        color: colorMap[city.color],
        heatMw: city.heatMw,
        selected: city.id === selectedCityId,
      },
      geometry: {
        type: "Point",
        coordinates: [city.longitude, city.latitude],
      },
    })),
  };
}

// Builds allocation flow lines from Paks to each served location.
function buildFlowFeatures(
  cities: CityAllocation[],
  paks: CityAllocation,
): FeatureCollection<LineString, FlowFeatureProps> {
  return {
    type: "FeatureCollection",
    features: cities
      .filter((city) => city.kind === "sink")
      .map((city) => ({
        type: "Feature",
        properties: {
          color: colorMap[city.color],
          width: Math.max(2.4, Math.min(6, city.heatMw / 70)),
        },
        geometry: {
          type: "LineString",
          coordinates: [
            [paks.longitude, paks.latitude],
            [city.longitude, city.latitude],
          ],
        },
      })),
  };
}

// Builds an approximate Danube segment through the demo locations.
function buildDanubeFeature(): Feature<LineString, Record<string, never>> {
  return {
    type: "Feature",
    properties: {},
    geometry: {
      type: "LineString",
      coordinates: [
        [19.055, 47.5],
        [18.985, 47.23],
        [18.935, 46.962],
        [18.854, 46.572],
        [18.74, 46.34],
      ],
    },
  };
}

// Fits the map to all known locations while leaving room for floating cards.
function fitMapToCities(map: MapLibreMap, cities: CityAllocation[]) {
  if (cities.length === 0) {
    return;
  }

  const bounds = new maplibregl.LngLatBounds();
  cities.forEach((city) => bounds.extend([city.longitude, city.latitude]));
  map.fitBounds(bounds, {
    padding: { top: 86, right: 242, bottom: 56, left: 64 },
    maxZoom: 8.7,
    duration: 0,
  });
}

// Creates a compact coordinate signature so zoom fitting only runs when locations change.
function getCitySignature(cities: CityAllocation[]) {
  return cities.map((city) => `${city.id}:${city.longitude},${city.latitude}`).join("|");
}

// Updates a GeoJSON source if it already exists on the map.
function setSourceData<TGeometry extends Point | LineString, TProps extends object>(
  map: MapLibreMap,
  sourceId: string,
  data: FeatureCollection<TGeometry, TProps> | Feature<TGeometry, TProps>,
) {
  const source = map.getSource(sourceId) as GeoJSONSource | undefined;
  source?.setData(data);
}

// Adds all dashboard overlay sources and layers to the base map.
function addAllocationLayers(map: MapLibreMap, data: ScenarioPayload, selectedCityId: string, riverColor: string) {
  const paks = data.cities.find((city) => city.id === "paks") ?? data.cities[0];

  map.addSource("danube", {
    type: "geojson",
    data: buildDanubeFeature(),
  });
  map.addSource("flows", {
    type: "geojson",
    data: buildFlowFeatures(data.cities, paks),
  });
  map.addSource("cities", {
    type: "geojson",
    data: buildCityFeatures(data.cities, selectedCityId),
  });

  map.addLayer({
    id: "danube-line",
    type: "line",
    source: "danube",
    paint: {
      "line-color": riverColor,
      "line-width": 5,
      "line-opacity": 0.8,
      "line-blur": 0.2,
    },
  });

  map.addLayer({
    id: "flow-lines",
    type: "line",
    source: "flows",
    paint: {
      "line-color": ["get", "color"],
      "line-width": ["get", "width"],
      "line-opacity": 0.76,
      "line-dasharray": [1.2, 1.2],
    },
  });

  map.addLayer({
    id: "city-halo",
    type: "circle",
    source: "cities",
    paint: {
      "circle-radius": ["case", ["get", "selected"], 15, ["==", ["get", "kind"], "source"], 12, 9],
      "circle-color": ["get", "color"],
      "circle-opacity": 0.2,
      "circle-stroke-color": ["get", "color"],
      "circle-stroke-width": ["case", ["get", "selected"], 2, 1],
      "circle-stroke-opacity": 0.9,
    },
  });

  map.addLayer({
    id: "city-core",
    type: "circle",
    source: "cities",
    paint: {
      "circle-radius": ["case", ["==", ["get", "kind"], "source"], 5.5, 4.5],
      "circle-color": ["get", "color"],
      "circle-stroke-color": "#ffffff",
      "circle-stroke-width": 1.75,
    },
  });

  map.addLayer({
    id: "city-click-area",
    type: "circle",
    source: "cities",
    paint: {
      "circle-radius": 18,
      "circle-color": "#000000",
      "circle-opacity": 0,
    },
  });
}

// Projects city coordinates into stable overlay-label positions.
function buildLabelPositions(
  map: MapLibreMap,
  cities: CityAllocation[],
  selectedCityId: string,
): LabelPosition[] {
  return cities.map((city) => {
    const point = map.project([city.longitude, city.latitude]);
    const offset = getLabelOffset(city.id);

    return {
      id: city.id,
      name: city.name,
      heatMw: city.heatMw,
      kind: city.kind,
      selected: city.id === selectedCityId,
      x: point.x + offset.x,
      y: point.y + offset.y,
    };
  });
}

// Keeps location labels out of the main flow lines and city markers.
function getLabelOffset(cityId: string) {
  switch (cityId) {
    case "budapest":
      return { x: 12, y: -34 };
    case "dunaujvaros":
      return { x: 18, y: -22 };
    case "paks":
      return { x: 18, y: 8 };
    case "szekszard":
      return { x: 18, y: -2 };
    default:
      return { x: 16, y: -18 };
  }
}

// Renders the geographic allocation panel with real map tiles and scalable location overlays.
export function MapPanel({ data }: { data: ScenarioPayload }) {
  const selectedCityId = useDashboardStore((state) => state.selectedCityId);
  const setSelectedCityId = useDashboardStore((state) => state.setSelectedCityId);
  const selectedCity = data.cities.find((city) => city.id === selectedCityId) ?? data.cities[0];
  const paks = data.cities.find((city) => city.id === "paks") ?? data.cities[0];
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const mapLoadedRef = useRef(false);
  const riverColor =
    data.danube.status === "crit" ? "#ef4444" : data.danube.status === "warn" ? "#0891b2" : "#0e7490";
  const latestMapDataRef = useRef({ data, selectedCityId, riverColor });
  const fittedCitySignatureRef = useRef<string | null>(null);
  const [labelPositions, setLabelPositions] = useState<LabelPosition[]>([]);
  const citySignature = useMemo(() => getCitySignature(data.cities), [data.cities]);

  const flowSummary = useMemo(() => {
    const servedCities = data.cities.filter((city) => city.kind === "sink").length;
    return `${servedCities} heat corridors · ${data.cities.length} nodes`;
  }, [data.cities]);

  useEffect(() => {
    latestMapDataRef.current = { data, selectedCityId, riverColor };
  }, [data, selectedCityId, riverColor]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) {
      return;
    }

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: baseMapStyle,
      center: [18.92, 46.88],
      zoom: 8.05,
      minZoom: 6.5,
      maxZoom: 12.5,
      attributionControl: false,
      dragRotate: false,
      pitchWithRotate: false,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-left");
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");

    const updateLabels = () => {
      const latest = latestMapDataRef.current;
      setLabelPositions(buildLabelPositions(map, latest.data.cities, latest.selectedCityId));
    };

    map.on("load", () => {
      const latest = latestMapDataRef.current;

      mapLoadedRef.current = true;
      map.resize();
      addAllocationLayers(map, latest.data, latest.selectedCityId, latest.riverColor);
      fitMapToCities(map, latest.data.cities);
      fittedCitySignatureRef.current = getCitySignature(latest.data.cities);
      updateLabels();
    });

    map.on("move", updateLabels);
    map.on("zoom", updateLabels);
    map.on("resize", updateLabels);

    map.on("click", "city-click-area", (event) => {
      const feature = event.features?.[0];
      const id = feature?.properties?.id;

      if (typeof id === "string") {
        setSelectedCityId(id);
      }
    });

    map.on("mouseenter", "city-click-area", () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", "city-click-area", () => {
      map.getCanvas().style.cursor = "";
    });

    mapRef.current = map;

    return () => {
      mapLoadedRef.current = false;
      setLabelPositions([]);
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [setSelectedCityId]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !mapLoadedRef.current) {
      return;
    }

    setSourceData(map, "danube", buildDanubeFeature());
    setSourceData(map, "flows", buildFlowFeatures(data.cities, paks));
    setSourceData(map, "cities", buildCityFeatures(data.cities, selectedCityId));
    map.setPaintProperty("danube-line", "line-color", riverColor);
    setLabelPositions(buildLabelPositions(map, data.cities, selectedCityId));

    if (fittedCitySignatureRef.current !== citySignature) {
      map.resize();
      fitMapToCities(map, data.cities);
      fittedCitySignatureRef.current = citySignature;
      setLabelPositions(buildLabelPositions(map, data.cities, selectedCityId));
    }
  }, [citySignature, data.cities, paks, riverColor, selectedCityId]);

  const danubeStatusColor =
    data.danube.status === "crit" ? "#ef4444" : data.danube.status === "warn" ? "#f59e0b" : "#0891b2";

  return (
    <section className="flex min-h-0 flex-col overflow-hidden border-r border-app-border bg-app-surface">
      <PanelHeader title="Geographic allocation" value="MapLibre · Hungary · CET" />
      <div className="relative min-h-0 flex-1 overflow-hidden bg-[#e6ecf2]">
        <div ref={mapContainerRef} className="h-full w-full" aria-label="Hungary heat allocation map" />

        <div className="pointer-events-none absolute inset-0 z-10">
          {labelPositions.map((label) => (
            <div
              key={label.id}
              className={clsx(
                "absolute left-0 top-0 max-w-[140px] rounded-md border px-2 py-1 text-[10px] leading-tight shadow-soft-pop",
                label.selected
                  ? "border-app-text/15 bg-app-text text-white"
                  : "border-app-border bg-white text-app-text",
              )}
              style={{ transform: `translate(${label.x}px, ${label.y}px)` }}
            >
              <div className="truncate font-semibold tracking-tight">
                {label.kind === "source" ? "Paks NPP" : label.name}
              </div>
              <div
                className={clsx(
                  "mono mt-0.5 text-[9px] tabular-nums",
                  label.selected ? "text-slate-300" : "text-app-muted",
                )}
              >
                {formatMw(label.heatMw)}
              </div>
            </div>
          ))}
        </div>

        <div className="pointer-events-none absolute left-3 top-3 rounded-lg border border-app-border bg-white/95 px-3 py-2 text-app-text shadow-soft-pop backdrop-blur-sm">
          <div className="text-[12px] font-semibold tracking-tight">Paks cogeneration network</div>
          <div className="mono mt-0.5 text-[10px] tabular-nums text-app-muted">{flowSummary}</div>
        </div>

        <div className="absolute right-3 top-3 w-[204px] rounded-lg border border-app-text/10 bg-app-text/95 p-3 text-white shadow-soft-pop backdrop-blur-sm">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="truncate text-[13px] font-semibold tracking-tight">{selectedCity.name}</span>
            <span className="rounded-sm border border-white/15 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.08em] text-slate-300">
              {selectedCity.kind === "source" ? "Source" : "Sink"}
            </span>
          </div>
          <div className="space-y-1.5">
            <CityRow label="Heat delivered" value={formatMw(selectedCity.heatMw)} />
            <CityRow label="Distance" value={selectedCity.distanceKm == null ? "—" : `${selectedCity.distanceKm} km`} />
            <CityRow
              label="Pipeline loss"
              value={selectedCity.pipelineLossPct == null ? "—" : `${selectedCity.pipelineLossPct.toFixed(1)}%`}
            />
            <CityRow
              label="Demand coverage"
              value={selectedCity.demandCoveragePct == null ? "—" : `${selectedCity.demandCoveragePct}%`}
              status={selectedCity.demandCoveragePct && selectedCity.demandCoveragePct > 90 ? "ok" : undefined}
            />
          </div>
        </div>
      </div>

      <div className="flex h-10 items-center gap-3 border-t border-app-border bg-app-sunken/40 px-4">
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-app-muted">Danube</span>
        <div className="relative h-[6px] min-w-0 flex-1 overflow-hidden rounded-full bg-app-elevated ring-1 ring-inset ring-app-border">
          <div
            className="h-full rounded-full transition-[width] duration-300"
            style={{
              width: `${Math.min(100, data.danube.pctOfLimit)}%`,
              backgroundColor: danubeStatusColor,
            }}
          />
        </div>
        <span
          className="mono w-[60px] shrink-0 text-right text-[12px] font-medium tabular-nums"
          style={{ color: danubeStatusColor }}
        >
          {formatTemp(data.danube.currentTempC)}
        </span>
        <span className="shrink-0 text-[10px] text-app-muted">
          / {formatTemp(data.danube.limitTempC)} limit
        </span>
      </div>
    </section>
  );
}

// Renders one compact city detail row inside the selected-city card.
function CityRow({ label, value, status }: { label: string; value: string; status?: "ok" }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-[11px] text-slate-300">{label}</span>
      <span
        className={clsx(
          "mono text-[11px] tabular-nums",
          status === "ok" ? "text-emerald-300" : "text-white",
        )}
      >
        {value}
      </span>
    </div>
  );
}

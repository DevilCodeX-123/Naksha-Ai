import React, { useEffect, useMemo, useState } from 'react';

const LGD_FILE =
  '/data/administrative/rajasthan/hierarchy.json';
// const DEFAULT_COUNTRY = 'India';

function formatSelectionSummary(selection) {
  if (!selection) {
    return '';
  }

  const parts = [];

  if (selection.state?.name) {
    parts.push(selection.state.name);
  }

  if (selection.district?.name) {
    parts.push(selection.district.name);
  }

  if (selection.geography?.name) {
    parts.push(selection.geography.name);
  }

  if (selection.ulb?.name) {
    parts.push(selection.ulb.name);
  }

  if (selection.ward?.number) {
    parts.push(`Ward ${selection.ward.number}`);
  }

  if (selection.coordinates) {
    return `Coordinates: ${selection.coordinates.latitude}, ${selection.coordinates.longitude}`;
  }

  return parts.join(' → ');
}


export default function AdministrativeSelector({
  onSelectionChange,
  initialSelection = null,
  compact = false,
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [
  currentSelection,
  setCurrentSelection
] = useState(initialSelection || null);

  const [mode, setMode] = useState(
    initialSelection?.geographyType || 'subDistrict'
  );

  const [selectedDistrict, setSelectedDistrict] = useState(
    initialSelection?.district?.code || ''
  );

  const [selectedSubDistrict, setSelectedSubDistrict] = useState(
    initialSelection?.geography?.type === 'Sub-District'
      ? initialSelection?.geography?.code || ''
      : ''
  );

  const [selectedUlb, setSelectedUlb] = useState(
    initialSelection?.geographyType === 'ulb' ||
    initialSelection?.geographyType === 'ward'
      ? initialSelection?.ulb?.code || ''
      : ''
  );

  const [selectedWard, setSelectedWard] = useState(
    initialSelection?.geographyType === 'ward'
      ? initialSelection?.ward?.code || ''
      : ''
  );

  const [latitude, setLatitude] = useState(
    initialSelection?.coordinates?.latitude ?? ''
  );

  const [longitude, setLongitude] = useState(
    initialSelection?.coordinates?.longitude ?? ''
  );

  useEffect(() => {
    async function loadLGDData() {
      try {
        setLoading(true);
        setError('');

        const response = await fetch(LGD_FILE);

        if (!response.ok) {
          throw new Error(
            `Could not load administrative data (${response.status}).`
          );
        }

        const json = await response.json();

        if (!json.state || !Array.isArray(json.districts)) {
          throw new Error(
            'Administrative hierarchy file has an unexpected structure.'
          );
        }

        setData(json);
      } catch (err) {
        console.error('LGD data error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadLGDData();
  }, []);

  useEffect(() => {
    if (!initialSelection) return;

    if (initialSelection.geographyType) {
      setMode(initialSelection.geographyType);
    }

    if (initialSelection.district?.code) {
      setSelectedDistrict(initialSelection.district.code);
    }

    if (
      initialSelection.geographyType === 'subDistrict' &&
      initialSelection.geography?.code
    ) {
      setSelectedSubDistrict(initialSelection.geography.code);
    }

    if (
      initialSelection.geographyType === 'ulb' ||
      initialSelection.geographyType === 'ward'
    ) {
      setSelectedUlb(initialSelection.ulb?.code || '');
    }

    if (
      initialSelection.geographyType === 'ward'
    ) {
      setSelectedWard(initialSelection.ward?.code || '');
    }

    if (initialSelection.coordinates) {
      setLatitude(initialSelection.coordinates.latitude ?? '');
      setLongitude(initialSelection.coordinates.longitude ?? '');
    }
  }, [initialSelection]);

  const state = data?.state || null;

  const districts = useMemo(
    () => data?.districts || [],
    [data]
  );

  const selectedDistrictData = useMemo(() => {
    return districts.find(
      (district) => district.code === selectedDistrict
    ) || null;
  }, [districts, selectedDistrict]);

  const subDistricts = useMemo(
    () => selectedDistrictData?.subDistricts || [],
    [selectedDistrictData]
  );

  const ulbs = useMemo(
    () => data?.urbanLocalBodies || [],
    [data]
  );

  const selectedUlbData = useMemo(() => {
    return ulbs.find(
      (ulb) => ulb.code === selectedUlb
    ) || null;
  }, [ulbs, selectedUlb]);

  const wards = useMemo(
    () => selectedUlbData?.wards || [],
    [selectedUlbData]
  );

 function emitSelection(selection) {
  setCurrentSelection(selection);

  if (typeof onSelectionChange === 'function') {
    onSelectionChange(selection);
  }
}

  function handleModeChange(event) {
    const nextMode = event.target.value;

    setMode(nextMode);

    setSelectedDistrict('');
    setSelectedSubDistrict('');
    setSelectedUlb('');
    setSelectedWard('');
    setLatitude('');
    setLongitude('');

    emitSelection({
      mode:
        nextMode === 'coordinates'
          ? 'coordinates'
          : 'administrative',

      geographyType: nextMode,

      state: state
        ? {
            code: state.code,
            name: state.name,
            type: state.type,
          }
        : null,

      district: null,
      geography: null,
      ulb: null,
      ward: null,
      coordinates: null,

      source: 'Government of India - LGD Rajasthan snapshot',
    });
  }

  function handleDistrictChange(event) {
    const districtCode = event.target.value;

    setSelectedDistrict(districtCode);
    setSelectedSubDistrict('');

    const district = districts.find(
      (item) => item.code === districtCode
    );

    emitSelection({
      mode: 'administrative',
      geographyType: 'district',

      state: state
        ? {
            code: state.code,
            name: state.name,
            type: state.type,
          }
        : null,

      district: district
        ? {
            code: district.code,
            name: district.name,
          }
        : null,

      geography: null,
      ulb: null,
      ward: null,
      coordinates: null,

      source: 'Government of India - LGD Rajasthan snapshot',
    });
  }

  function handleSubDistrictChange(event) {
    const code = event.target.value;

    setSelectedSubDistrict(code);

    const subDistrict = subDistricts.find(
      (item) => item.code === code
    );

    emitSelection({
      mode: 'administrative',
      geographyType: 'subDistrict',

      state: state
        ? {
            code: state.code,
            name: state.name,
            type: state.type,
          }
        : null,

      district: selectedDistrictData
        ? {
            code: selectedDistrictData.code,
            name: selectedDistrictData.name,
          }
        : null,

      geography: subDistrict
        ? {
            code: subDistrict.code,
            name: subDistrict.name,
            type: 'Sub-District',
          }
        : null,

      ulb: null,
      ward: null,
      coordinates: null,

      source: 'Government of India - LGD Rajasthan snapshot',
    });
  }

  function handleUlbChange(event) {
    const code = event.target.value;

    setSelectedUlb(code);
    setSelectedWard('');

    const ulb = ulbs.find(
      (item) => item.code === code
    );

    emitSelection({
      mode: 'administrative',
      geographyType: 'ulb',

      state: state
        ? {
            code: state.code,
            name: state.name,
            type: state.type,
          }
        : null,

      district: null,

      geography: null,

      ulb: ulb
        ? {
            code: ulb.code,
            name: ulb.name,
            type: ulb.typeName,
          }
        : null,

      ward: null,
      coordinates: null,

      source: 'Government of India - LGD Rajasthan snapshot',
    });
  }

  function handleWardChange(event) {
    const code = event.target.value;

    setSelectedWard(code);

    const ward = wards.find(
      (item) => item.wardCode === code
    );

    emitSelection({
      mode: 'administrative',
      geographyType: 'ward',

      state: state
        ? {
            code: state.code,
            name: state.name,
            type: state.type,
          }
        : null,

      district: null,

      geography: null,

      ulb: selectedUlbData
        ? {
            code: selectedUlbData.code,
            name: selectedUlbData.name,
            type: selectedUlbData.typeName,
          }
        : null,

      ward: ward
        ? {
            code: ward.wardCode,
            number: ward.wardNumber,
            name: ward.name,
          }
        : null,

      coordinates: null,

      source: 'Government of India - LGD Rajasthan snapshot',
    });
  }

  function handleCoordinateChange(type, value) {
    let nextLatitude = latitude;
    let nextLongitude = longitude;

    if (type === 'latitude') {
      nextLatitude = value;
      setLatitude(value);
    }

    if (type === 'longitude') {
      nextLongitude = value;
      setLongitude(value);
    }

    const lat = Number(nextLatitude);
    const lng = Number(nextLongitude);

    const valid =
      nextLatitude !== '' &&
      nextLongitude !== '' &&
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180;

    emitSelection({
      mode: 'coordinates',
      geographyType: 'coordinates',

      state: state
        ? {
            code: state.code,
            name: state.name,
            type: state.type,
          }
        : null,

      district: null,
      geography: null,
      ulb: null,
      ward: null,

      coordinates: valid
        ? {
            latitude: lat,
            longitude: lng,
          }
        : null,

      source: 'Custom coordinates',
    });
  }

  if (loading) {
    return (
      <div
        style={{
          padding: compact ? '8px 0' : '12px',
          fontSize: compact ? '11px' : '12px',
          color: compact ? '#cbd5e1' : '#64748b',
        }}
      >
        Loading official administrative data...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: '10px',
          borderRadius: '7px',
          background: compact ? '#1e293b' : '#fef2f2',
          color: compact ? '#fecaca' : '#b91c1c',
          fontSize: '11px',
          lineHeight: 1.45,
        }}
      >
        {error}
      </div>
    );
  }

  const labelColor = compact ? '#cbd5e1' : '#475569';

  const selectStyle = {
    width: '100%',
    boxSizing: 'border-box',
    padding: compact ? '7px 8px' : '9px 10px',
    marginBottom: compact ? '8px' : '10px',
    borderRadius: '6px',
    border: compact
      ? '1px solid #334155'
      : '1px solid #cbd5e1',
    background: compact ? '#111827' : '#ffffff',
    color: compact ? '#f8fafc' : '#0f172a',
    fontSize: compact ? '11px' : '12px',
    outline: 'none',
  };

  const inputStyle = {
    ...selectStyle,
  };

  return (
    <div
      style={{
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {!compact && (
        <>
          <div
            style={{
              fontSize: '1.05rem',
              fontWeight: 700,
              color: '#0f172a',
              marginBottom: '4px',
            }}
          >
            Spatial Mapping
          </div>

          <div
            style={{
              fontSize: '11px',
              color: '#64748b',
              marginBottom: '14px',
              lineHeight: 1.45,
            }}
          >
            Select an administrative area or enter custom coordinates.
          </div>
        </>
      )}

      <label
        style={{
          display: 'block',
          fontSize: compact ? '10px' : '11px',
          fontWeight: 700,
          color: labelColor,
          marginBottom: '5px',
        }}
      >
        State / Union Territory
      </label>

      <select
        value={state?.code || ''}
        disabled
        style={{
          ...selectStyle,
          opacity: 0.9,
          cursor: 'not-allowed',
        }}
      >
        <option value="">
          Loading State...
        </option>

        {state && (
          <option value={state.code}>
            {state.name}
            {state.type === 'UT' ? ' (UT)' : ''}
          </option>
        )}
      </select>

      <label
        style={{
          display: 'block',
          fontSize: compact ? '10px' : '11px',
          fontWeight: 700,
          color: labelColor,
          marginBottom: '5px',
        }}
      >
        Analysis Geography
      </label>

      <select
        value={mode}
        onChange={handleModeChange}
        style={selectStyle}
      >
        <option value="subDistrict">
          Sub-District / Tehsil
        </option>

        <option value="ulb">
          Urban Local Body
        </option>

        <option value="ward">
          ULB Ward
        </option>

        <option value="coordinates">
          Custom Coordinates
        </option>
      </select>

      {mode === 'subDistrict' && (
        <>
          <label
            style={{
              display: 'block',
              fontSize: compact ? '10px' : '11px',
              fontWeight: 700,
              color: labelColor,
              marginBottom: '5px',
            }}
          >
            District
          </label>

          <select
            value={selectedDistrict}
            onChange={handleDistrictChange}
            style={selectStyle}
          >
            <option value="">
              Select District
            </option>

            {districts.map((district) => (
              <option
                key={district.code}
                value={district.code}
              >
                {district.name}
              </option>
            ))}
          </select>

          <label
            style={{
              display: 'block',
              fontSize: compact ? '10px' : '11px',
              fontWeight: 700,
              color: labelColor,
              marginBottom: '5px',
            }}
          >
            Sub-District / Tehsil
          </label>

          <select
            value={selectedSubDistrict}
            onChange={handleSubDistrictChange}
            disabled={!selectedDistrict}
            style={{
              ...selectStyle,
              opacity: selectedDistrict ? 1 : 0.55,
            }}
          >
            <option value="">
              {selectedDistrict
                ? 'Select Sub-District'
                : 'Select District first'}
            </option>

            {subDistricts.map((item) => (
              <option
                key={item.code}
                value={item.code}
              >
                {item.name}
              </option>
            ))}
          </select>
        </>
      )}

      {mode === 'ulb' && (
        <>
          <label
            style={{
              display: 'block',
              fontSize: compact ? '10px' : '11px',
              fontWeight: 700,
              color: labelColor,
              marginBottom: '5px',
            }}
          >
            Urban Local Body
          </label>

          <select
            value={selectedUlb}
            onChange={handleUlbChange}
            style={selectStyle}
          >
            <option value="">
              Select Urban Local Body
            </option>

            {ulbs.map((ulb) => (
              <option
                key={ulb.code}
                value={ulb.code}
              >
                {ulb.name} — {ulb.typeName}
              </option>
            ))}
          </select>

          <div
            style={{
              fontSize: '10px',
              lineHeight: 1.45,
              color: compact ? '#94a3b8' : '#64748b',
              marginTop: '-3px',
              marginBottom: '8px',
            }}
          >
            ULBs are maintained as a separate LGD local-government
            branch. Ward relationships use the official Local Body Code.
          </div>
        </>
      )}

      {mode === 'ward' && (
        <>
          <label
            style={{
              display: 'block',
              fontSize: compact ? '10px' : '11px',
              fontWeight: 700,
              color: labelColor,
              marginBottom: '5px',
            }}
          >
            Urban Local Body
          </label>

          <select
            value={selectedUlb}
            onChange={handleUlbChange}
            style={selectStyle}
          >
            <option value="">
              Select Urban Local Body
            </option>

            {ulbs.map((ulb) => (
              <option
                key={ulb.code}
                value={ulb.code}
              >
                {ulb.name}
              </option>
            ))}
          </select>

          <label
            style={{
              display: 'block',
              fontSize: compact ? '10px' : '11px',
              fontWeight: 700,
              color: labelColor,
              marginBottom: '5px',
            }}
          >
            Ward
          </label>

          <select
            value={selectedWard}
            onChange={handleWardChange}
            disabled={!selectedUlb}
            style={{
              ...selectStyle,
              opacity: selectedUlb ? 1 : 0.55,
            }}
          >
            <option value="">
              {selectedUlb
                ? 'Select Ward'
                : 'Select ULB first'}
            </option>

            {wards.map((ward) => (
              <option
                key={ward.wardCode}
                value={ward.wardCode}
              >
                Ward {ward.wardNumber} — {ward.name}
              </option>
            ))}
          </select>
        </>
      )}

     {mode === 'coordinates' && (
  <>
    <label
      style={{
        display: 'block',
        fontSize: compact ? '10px' : '11px',
        fontWeight: 700,
        color: labelColor,
        marginBottom: '5px',
      }}
    >
      Latitude
    </label>

    <input
      type="number"
      step="any"
      value={latitude}
      onChange={(event) =>
        handleCoordinateChange(
          'latitude',
          event.target.value
        )
      }
      placeholder="e.g. 26.9124"
      style={inputStyle}
    />

    <label
      style={{
        display: 'block',
        fontSize: compact ? '10px' : '11px',
        fontWeight: 700,
        color: labelColor,
        marginBottom: '5px',
      }}
    >
      Longitude
    </label>

    <input
      type="number"
      step="any"
      value={longitude}
      onChange={(event) =>
        handleCoordinateChange(
          'longitude',
          event.target.value
        )
      }
      placeholder="e.g. 75.7873"
      style={inputStyle}
    />

    <button
      type="button"
      onClick={() => {
        const lat = Number(latitude);
        const lng = Number(longitude);

        if (
          !Number.isFinite(lat) ||
          !Number.isFinite(lng) ||
          lat < -90 ||
          lat > 90 ||
          lng < -180 ||
          lng > 180
        ) {
          return;
        }

        const selection = {
          mode: 'coordinates',
          geographyType: 'coordinates',

          state: null,
          district: null,
          geography: null,
          ulb: null,
          ward: null,

          coordinates: {
            latitude: lat,
            longitude: lng,
          },

          source: 'Custom coordinates',
        };

        emitSelection(selection);
      }}
      style={{
        width: '100%',
        marginTop: '4px',
        marginBottom: '8px',
        padding: '9px 12px',
        border: 'none',
        borderRadius: '6px',
        background: '#2563eb',
        color: '#ffffff',
        fontSize: '12px',
        fontWeight: '600',
        cursor: 'pointer',
      }}
    >
      Locate on Map
    </button>

    <div
      style={{
        fontSize: '10px',
        lineHeight: 1.45,
        color: compact ? '#94a3b8' : '#64748b',
      }}
    >
      Enter latitude and longitude, then select
      <strong> Locate on Map </strong>
      to move the map to that location.
    </div>
  </>
)}
      
{currentSelection && (
  <div
    style={{
      marginTop: '12px',
      padding: '10px 12px',
      borderRadius: '7px',
      background: compact
        ? '#172554'
        : '#eff6ff',
      border: compact
        ? '1px solid #1e40af'
        : '1px solid #bfdbfe',
      color: compact
        ? '#dbeafe'
        : '#1e3a8a',
      fontSize: '11px',
      lineHeight: 1.5,
    }}
  >
    <div
      style={{
        fontSize: '10px',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: '0.4px',
        marginBottom: '3px',
      }}
    >
      Selected Analysis Area
    </div>

    <div style={{ fontWeight: '600' }}>
      {formatSelectionSummary(currentSelection)}
    </div>
  </div>
)}

      <div
        style={{
          marginTop: compact ? '3px' : '10px',
          fontSize: '9px',
          lineHeight: 1.4,
          color: compact ? '#64748b' : '#94a3b8',
        }}
      >
        Administrative source: Government of India Local Government
        Directory (LGD) — Rajasthan snapshot.
      </div>
    </div>
  );
}
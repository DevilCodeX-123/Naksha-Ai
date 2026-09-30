import sys
content = open('naksha_frontend/src/components/views/SurveyCoverage.jsx', encoding='utf-8').read()

old = """  useEffect(() => {
    fetch(`${API_BASE}/api/v1/states`)
      .then(res => res.json())
      .then(data => setStatesData(data))
      .catch(err => console.error("Failed to fetch states:", err));
  }, []);"""

new = """  useEffect(() => {
    const fallbackStates = [
      { id: 'ST01', name: 'Rajasthan', completeness: 85, activeLayers: 6, areaMapped: '1,20,400 sq km', totalParcels: '45,200', lGDCode: '08' },
      { id: 'ST02', name: 'Gujarat', completeness: 72, activeLayers: 5, areaMapped: '98,000 sq km', totalParcels: '32,100', lGDCode: '24' },
      { id: 'ST03', name: 'Maharashtra', completeness: 65, activeLayers: 4, areaMapped: '1,45,000 sq km', totalParcels: '56,800', lGDCode: '27' },
      { id: 'ST04', name: 'Karnataka', completeness: 40, activeLayers: 3, areaMapped: '60,000 sq km', totalParcels: '18,500', lGDCode: '29' }
    ];
    fetch(`${API_BASE}/api/v1/states`)
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then(data => {
        if (data && data.length > 0) {
          setStatesData(data);
        } else {
          setStatesData(fallbackStates);
        }
      })
      .catch(err => {
        console.error("Failed to fetch states:", err);
        setStatesData(fallbackStates);
      });
  }, []);"""

if old in content:
    content = content.replace(old, new)
    open('naksha_frontend/src/components/views/SurveyCoverage.jsx', 'w', encoding='utf-8').write(content)
    print('Updated SurveyCoverage')
else:
    print('Not found')

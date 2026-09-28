export const SITE_CONFIG = {
  title: "LAND MAPPING",
  subtitle: "Explore India's land survey and geospatial coverage",
  isPrototype: true,
  prototypeBadge: "Prototype / Demonstration Data",
  prototypeMessage: "Demonstration dataset — survey status figures are representative and not official government statistics."
};

export const DEMO_STATS = {
  nationalCoverage: 42.8,
  totalDistricts: 785,
  mappedDistricts: 336,
  mappedAreaSqKm: "1,407,250",
  activeSurveys: 124
};

export const STATE_DATA = [
  {
    "id": "ANDH",
    "name": "Andhra Pradesh",
    "coverage": 95,
    "districts": 4,
    "mappedArea": "209,788",
    "pendingArea": "27,577",
    "status": "High Coverage",
    "image": "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=600&q=80",
    "datasets": {
      "ORI": false,
      "parcels": false,
      "gnss": false,
      "groundTruth": true,
      "buildings": true
    }
  },
  {
    "id": "ARUN",
    "name": "Arunachal Pradesh",
    "coverage": 13,
    "districts": 46,
    "mappedArea": "191,609",
    "pendingArea": "39,120",
    "status": "Low Coverage",
    "image": "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=600&q=80",
    "datasets": {
      "ORI": false,
      "parcels": true,
      "gnss": true,
      "groundTruth": false,
      "buildings": false
    }
  },
  {
    "id": "ASSA",
    "name": "Assam",
    "coverage": 92,
    "districts": 18,
    "mappedArea": "54,650",
    "pendingArea": "41,309",
    "status": "High Coverage",
    "image": "https://images.unsplash.com/photo-1609946782701-7ac42674e2a8?auto=format&fit=crop&w=600&q=80",
    "datasets": {
      "ORI": false,
      "parcels": false,
      "gnss": true,
      "groundTruth": true,
      "buildings": false
    }
  },
  {
    "id": "BIHA",
    "name": "Bihar",
    "coverage": 75,
    "districts": 25,
    "mappedArea": "129,919",
    "pendingArea": "46,614",
    "status": "Moderate Coverage",
    "image": "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=600&q=80",
    "datasets": {
      "ORI": true,
      "parcels": true,
      "gnss": false,
      "groundTruth": true,
      "buildings": false
    }
  },
  {
    "id": "CHHA",
    "name": "Chhattisgarh",
    "coverage": 79,
    "districts": 38,
    "mappedArea": "186,251",
    "pendingArea": "65,622",
    "status": "Moderate Coverage",
    "image": "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=600&q=80",
    "datasets": {
      "ORI": false,
      "parcels": true,
      "gnss": false,
      "groundTruth": true,
      "buildings": false
    }
  },
  {
    "id": "GOA",
    "name": "Goa",
    "coverage": 18,
    "districts": 16,
    "mappedArea": "205,382",
    "pendingArea": "8,473",
    "status": "Low Coverage",
    "image": "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=600&q=80",
    "datasets": {
      "ORI": true,
      "parcels": false,
      "gnss": false,
      "groundTruth": false,
      "buildings": false
    }
  },
  {
    "id": "GUJA",
    "name": "Gujarat",
    "coverage": 92,
    "districts": 47,
    "mappedArea": "269,728",
    "pendingArea": "80,854",
    "status": "High Coverage",
    "image": "https://images.unsplash.com/photo-1560179406-1c6c60e0dc26?auto=format&fit=crop&w=600&q=80",
    "datasets": {
      "ORI": true,
      "parcels": true,
      "gnss": true,
      "groundTruth": false,
      "buildings": true
    }
  },
  {
    "id": "HARY",
    "name": "Haryana",
    "coverage": 67,
    "districts": 25,
    "mappedArea": "57,641",
    "pendingArea": "96,915",
    "status": "Moderate Coverage",
    "image": "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=600&q=80",
    "datasets": {
      "ORI": true,
      "parcels": false,
      "gnss": false,
      "groundTruth": true,
      "buildings": true
    }
  },
  {
    "id": "HIMA",
    "name": "Himachal Pradesh",
    "coverage": 71,
    "districts": 73,
    "mappedArea": "283,142",
    "pendingArea": "93,269",
    "status": "Moderate Coverage",
    "image": "https://images.unsplash.com/photo-1623345805780-8f01f714e65f?auto=format&fit=crop&w=600&q=80",
    "datasets": {
      "ORI": false,
      "parcels": true,
      "gnss": false,
      "groundTruth": true,
      "buildings": true
    }
  },
  {
    "id": "JHAR",
    "name": "Jharkhand",
    "coverage": 29,
    "districts": 66,
    "mappedArea": "100,544",
    "pendingArea": "56,989",
    "status": "Low Coverage",
    "image": "https://images.unsplash.com/photo-1560179406-1c6c60e0dc26?auto=format&fit=crop&w=600&q=80",
    "datasets": {
      "ORI": true,
      "parcels": true,
      "gnss": true,
      "groundTruth": false,
      "buildings": false
    }
  },
  {
    "id": "KARN",
    "name": "Karnataka",
    "coverage": 64,
    "districts": 31,
    "mappedArea": "122,700",
    "pendingArea": "69,000",
    "status": "Moderate Coverage",
    "image": "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=600&q=80",
    "datasets": {
      "ORI": true,
      "parcels": true,
      "gnss": false,
      "groundTruth": true,
      "buildings": false
    }
  },
  {
    "id": "KERA",
    "name": "Kerala",
    "coverage": 76,
    "districts": 57,
    "mappedArea": "129,193",
    "pendingArea": "91,224",
    "status": "Moderate Coverage",
    "image": "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=600&q=80",
    "datasets": {
      "ORI": false,
      "parcels": false,
      "gnss": true,
      "groundTruth": true,
      "buildings": true
    }
  },
  {
    "id": "MADH",
    "name": "Madhya Pradesh",
    "coverage": 58,
    "districts": 55,
    "mappedArea": "178,700",
    "pendingArea": "129,540",
    "status": "Ongoing Survey",
    "image": "https://images.unsplash.com/photo-1609946782701-7ac42674e2a8?auto=format&fit=crop&w=600&q=80",
    "datasets": {
      "ORI": true,
      "parcels": true,
      "gnss": false,
      "groundTruth": false,
      "buildings": false
    }
  },
  {
    "id": "MAHA",
    "name": "Maharashtra",
    "coverage": 85,
    "districts": 36,
    "mappedArea": "261,375",
    "pendingArea": "46,125",
    "status": "High Coverage",
    "image": "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=600&q=80",
    "datasets": {
      "ORI": true,
      "parcels": true,
      "gnss": true,
      "groundTruth": true,
      "buildings": true
    }
  },
  {
    "id": "MANI",
    "name": "Manipur",
    "coverage": 13,
    "districts": 38,
    "mappedArea": "177,635",
    "pendingArea": "23,392",
    "status": "Low Coverage",
    "image": "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=600&q=80",
    "datasets": {
      "ORI": true,
      "parcels": true,
      "gnss": true,
      "groundTruth": true,
      "buildings": true
    }
  },
  {
    "id": "MEGH",
    "name": "Meghalaya",
    "coverage": 38,
    "districts": 9,
    "mappedArea": "291,995",
    "pendingArea": "83,528",
    "status": "Partial Survey Coverage",
    "image": "https://images.unsplash.com/photo-1623345805780-8f01f714e65f?auto=format&fit=crop&w=600&q=80",
    "datasets": {
      "ORI": false,
      "parcels": true,
      "gnss": true,
      "groundTruth": false,
      "buildings": false
    }
  },
  {
    "id": "MIZO",
    "name": "Mizoram",
    "coverage": 39,
    "districts": 54,
    "mappedArea": "290,713",
    "pendingArea": "33,343",
    "status": "Partial Survey Coverage",
    "image": "https://images.unsplash.com/photo-1560179406-1c6c60e0dc26?auto=format&fit=crop&w=600&q=80",
    "datasets": {
      "ORI": true,
      "parcels": false,
      "gnss": false,
      "groundTruth": true,
      "buildings": false
    }
  },
  {
    "id": "NAGA",
    "name": "Nagaland",
    "coverage": 85,
    "districts": 47,
    "mappedArea": "206,225",
    "pendingArea": "27,578",
    "status": "High Coverage",
    "image": "https://images.unsplash.com/photo-1560179406-1c6c60e0dc26?auto=format&fit=crop&w=600&q=80",
    "datasets": {
      "ORI": false,
      "parcels": true,
      "gnss": false,
      "groundTruth": false,
      "buildings": true
    }
  },
  {
    "id": "ODIS",
    "name": "Odisha",
    "coverage": 83,
    "districts": 36,
    "mappedArea": "256,496",
    "pendingArea": "34,156",
    "status": "High Coverage",
    "image": "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=600&q=80",
    "datasets": {
      "ORI": true,
      "parcels": false,
      "gnss": false,
      "groundTruth": false,
      "buildings": true
    }
  },
  {
    "id": "PUNJ",
    "name": "Punjab",
    "coverage": 17,
    "districts": 30,
    "mappedArea": "217,896",
    "pendingArea": "100,491",
    "status": "Low Coverage",
    "image": "https://images.unsplash.com/photo-1609946782701-7ac42674e2a8?auto=format&fit=crop&w=600&q=80",
    "datasets": {
      "ORI": true,
      "parcels": false,
      "gnss": true,
      "groundTruth": false,
      "buildings": false
    }
  },
  {
    "id": "RAJA",
    "name": "Rajasthan",
    "coverage": 72,
    "districts": 50,
    "mappedArea": "246,380",
    "pendingArea": "95,859",
    "status": "Partial Survey Coverage",
    "image": "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=600&q=80",
    "datasets": {
      "ORI": true,
      "parcels": true,
      "gnss": false,
      "groundTruth": false,
      "buildings": true
    }
  },
  {
    "id": "SIKK",
    "name": "Sikkim",
    "coverage": 23,
    "districts": 42,
    "mappedArea": "57,594",
    "pendingArea": "93,396",
    "status": "Low Coverage",
    "image": "https://images.unsplash.com/photo-1609946782701-7ac42674e2a8?auto=format&fit=crop&w=600&q=80",
    "datasets": {
      "ORI": true,
      "parcels": false,
      "gnss": false,
      "groundTruth": false,
      "buildings": true
    }
  },
  {
    "id": "TAMI",
    "name": "Tamil Nadu",
    "coverage": 76,
    "districts": 45,
    "mappedArea": "101,585",
    "pendingArea": "52,495",
    "status": "Moderate Coverage",
    "image": "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=600&q=80",
    "datasets": {
      "ORI": false,
      "parcels": false,
      "gnss": false,
      "groundTruth": true,
      "buildings": false
    }
  },
  {
    "id": "TELA",
    "name": "Telangana",
    "coverage": 82,
    "districts": 68,
    "mappedArea": "94,938",
    "pendingArea": "63,494",
    "status": "High Coverage",
    "image": "https://images.unsplash.com/photo-1609946782701-7ac42674e2a8?auto=format&fit=crop&w=600&q=80",
    "datasets": {
      "ORI": true,
      "parcels": true,
      "gnss": false,
      "groundTruth": true,
      "buildings": true
    }
  },
  {
    "id": "TRIP",
    "name": "Tripura",
    "coverage": 16,
    "districts": 70,
    "mappedArea": "110,816",
    "pendingArea": "63,220",
    "status": "Low Coverage",
    "image": "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=600&q=80",
    "datasets": {
      "ORI": true,
      "parcels": true,
      "gnss": true,
      "groundTruth": true,
      "buildings": false
    }
  },
  {
    "id": "UTTA",
    "name": "Uttar Pradesh",
    "coverage": 18,
    "districts": 6,
    "mappedArea": "280,936",
    "pendingArea": "91,301",
    "status": "Low Coverage",
    "image": "https://images.unsplash.com/photo-1623345805780-8f01f714e65f?auto=format&fit=crop&w=600&q=80",
    "datasets": {
      "ORI": false,
      "parcels": true,
      "gnss": true,
      "groundTruth": true,
      "buildings": true
    }
  },
  {
    "id": "UTTA",
    "name": "Uttarakhand",
    "coverage": 93,
    "districts": 26,
    "mappedArea": "292,145",
    "pendingArea": "97,381",
    "status": "High Coverage",
    "image": "https://images.unsplash.com/photo-1609946782701-7ac42674e2a8?auto=format&fit=crop&w=600&q=80",
    "datasets": {
      "ORI": false,
      "parcels": false,
      "gnss": true,
      "groundTruth": true,
      "buildings": true
    }
  },
  {
    "id": "WEST",
    "name": "West Bengal",
    "coverage": 27,
    "districts": 39,
    "mappedArea": "154,773",
    "pendingArea": "80,759",
    "status": "Low Coverage",
    "image": "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=600&q=80",
    "datasets": {
      "ORI": true,
      "parcels": false,
      "gnss": false,
      "groundTruth": false,
      "buildings": false
    }
  },
  {
    "id": "ANDA",
    "name": "Andaman and Nicobar Islands",
    "coverage": 18,
    "districts": 45,
    "mappedArea": "242,567",
    "pendingArea": "38,295",
    "status": "Low Coverage",
    "image": "https://images.unsplash.com/photo-1560179406-1c6c60e0dc26?auto=format&fit=crop&w=600&q=80",
    "datasets": {
      "ORI": true,
      "parcels": false,
      "gnss": false,
      "groundTruth": true,
      "buildings": true
    }
  },
  {
    "id": "CHAN",
    "name": "Chandigarh",
    "coverage": 47,
    "districts": 25,
    "mappedArea": "145,502",
    "pendingArea": "27,319",
    "status": "Partial Survey Coverage",
    "image": "https://images.unsplash.com/photo-1609946782701-7ac42674e2a8?auto=format&fit=crop&w=600&q=80",
    "datasets": {
      "ORI": false,
      "parcels": false,
      "gnss": true,
      "groundTruth": true,
      "buildings": true
    }
  },
  {
    "id": "DADR",
    "name": "Dadra and Nagar Haveli and Daman and Diu",
    "coverage": 34,
    "districts": 31,
    "mappedArea": "181,483",
    "pendingArea": "51,746",
    "status": "Partial Survey Coverage",
    "image": "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=600&q=80",
    "datasets": {
      "ORI": true,
      "parcels": true,
      "gnss": true,
      "groundTruth": false,
      "buildings": true
    }
  },
  {
    "id": "DELH",
    "name": "Delhi",
    "coverage": 44,
    "districts": 60,
    "mappedArea": "167,406",
    "pendingArea": "96,331",
    "status": "Partial Survey Coverage",
    "image": "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=600&q=80",
    "datasets": {
      "ORI": true,
      "parcels": true,
      "gnss": false,
      "groundTruth": true,
      "buildings": false
    }
  },
  {
    "id": "JAMM",
    "name": "Jammu and Kashmir",
    "coverage": 27,
    "districts": 68,
    "mappedArea": "30,527",
    "pendingArea": "38,538",
    "status": "Low Coverage",
    "image": "https://images.unsplash.com/photo-1609946782701-7ac42674e2a8?auto=format&fit=crop&w=600&q=80",
    "datasets": {
      "ORI": false,
      "parcels": true,
      "gnss": true,
      "groundTruth": true,
      "buildings": false
    }
  },
  {
    "id": "LADA",
    "name": "Ladakh",
    "coverage": 12,
    "districts": 61,
    "mappedArea": "42,518",
    "pendingArea": "65,876",
    "status": "Low Coverage",
    "image": "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=600&q=80",
    "datasets": {
      "ORI": false,
      "parcels": false,
      "gnss": true,
      "groundTruth": true,
      "buildings": true
    }
  },
  {
    "id": "LAKS",
    "name": "Lakshadweep",
    "coverage": 79,
    "districts": 10,
    "mappedArea": "251,894",
    "pendingArea": "17,622",
    "status": "Moderate Coverage",
    "image": "https://images.unsplash.com/photo-1560179406-1c6c60e0dc26?auto=format&fit=crop&w=600&q=80",
    "datasets": {
      "ORI": true,
      "parcels": true,
      "gnss": false,
      "groundTruth": false,
      "buildings": true
    }
  },
  {
    "id": "PUDU",
    "name": "Puducherry",
    "coverage": 65,
    "districts": 42,
    "mappedArea": "191,986",
    "pendingArea": "99,682",
    "status": "Moderate Coverage",
    "image": "https://images.unsplash.com/photo-1609946782701-7ac42674e2a8?auto=format&fit=crop&w=600&q=80",
    "datasets": {
      "ORI": true,
      "parcels": true,
      "gnss": false,
      "groundTruth": false,
      "buildings": false
    }
  }
];

export const NOTIFICATIONS = [
  { id: 1, type: "info", title: "Jaipur Ward Survey Complete", date: "2 Hours ago", detail: "High-resolution orthorectified imagery updated for Ward 14." },
  { id: 2, type: "update", title: "Dataset Refresh", date: "Yesterday", detail: "Road network vector geometries resynchronized with PostGIS." },
  { id: 3, type: "warning", title: "Survey Gap Alert", date: "3 days ago", detail: "Elevation model datasets missing for eastern development zones." }
];

export const FAQS = [
  { q: "What is LAND MAPPING?", a: "LAND MAPPING is a public-facing geospatial transparency platform designed to display land survey coverage and dataset completeness across Indian states and districts." },
  { q: "What does 'Partial Coverage' mean?", a: "Partial coverage indicates that base drone/satellite imagery exists, but parcel boundaries or ground-truth verification remain incomplete." },
  { q: "Is this official government data?", a: "This application is an educational and technological prototype demonstrating Web-GIS capabilities." }
];
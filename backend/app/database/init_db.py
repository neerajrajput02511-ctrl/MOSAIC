import datetime
from sqlalchemy.orm import Session
from backend.app.database.session import engine, Base, SessionLocal
from backend.app.database.models import Region, Location, ModelMetadata, DataSourceStatus

def init_db():
    # Create all tables in SQLite / PostgreSQL
    Base.metadata.create_all(bind=engine)
    
    db: Session = SessionLocal()
    try:
        # 1. Seed Regions (Priority to North Eastern Region)
        regions_data = [
            {"code": "NER_ASSAM", "name": "Assam", "description": "Brahmaputra & Barak Valley, High Flood/Rainfall Vulnerability", "is_ner": True},
            {"code": "NER_MEGHALAYA", "name": "Meghalaya", "description": "Khasi & Garo Hills, Extreme Orographic Precipitation Zone", "is_ner": True},
            {"code": "NER_ARUNACHAL", "name": "Arunachal Pradesh", "description": "Eastern Himalayan Region, Flash Flood & Landslide Risk", "is_ner": True},
            {"code": "NER_MANIPUR", "name": "Manipur", "description": "Imphal Valley & Surrounding Hills", "is_ner": True},
            {"code": "NER_MIZORAM", "name": "Mizoram", "description": "Lushai Hills, Heavy Monsoon Influx", "is_ner": True},
            {"code": "NER_NAGALAND", "name": "Nagaland", "description": "Naga Hills, Cloudburst Vulnerable", "is_ner": True},
            {"code": "NER_TRIPURA", "name": "Tripura", "description": "Lowland & Foothill Plains", "is_ner": True},
            {"code": "NER_SIKKIM", "name": "Sikkim", "description": "Teesta Basin, Glacial Lake & Extreme Rainfall Risk", "is_ner": True},
            {"code": "INDIA_NORTH", "name": "Northern India", "description": "Indo-Gangetic Plain & Foothills", "is_ner": False},
            {"code": "INDIA_WEST", "name": "Western India", "description": "Konkan Coast & Arid Zones", "is_ner": False},
            {"code": "INDIA_EAST", "name": "Eastern India", "description": "Gangetic Delta & Bay of Bengal Cyclone Track", "is_ner": False},
            {"code": "INDIA_SOUTH", "name": "Southern Peninsula", "description": "Deccan Plateau & Western Ghats", "is_ner": False},
        ]
        
        region_map = {}
        for r_item in regions_data:
            existing = db.query(Region).filter(Region.code == r_item["code"]).first()
            if not existing:
                reg = Region(**r_item)
                db.add(reg)
                db.flush()
                region_map[r_item["code"]] = reg.id
            else:
                region_map[r_item["code"]] = existing.id
                
        # 2. Seed Strategic Locations (Focus on NER capitals and stations)
        locations_data = [
            {"name": "Guwahati", "state": "Assam", "district": "Kamrup Metropolitan", "latitude": 26.1445, "longitude": 91.7362, "elevation_m": 55.0, "is_ner": True, "region_code": "NER_ASSAM"},
            {"name": "Dibrugarh", "state": "Assam", "district": "Dibrugarh", "latitude": 27.4728, "longitude": 94.9120, "elevation_m": 108.0, "is_ner": True, "region_code": "NER_ASSAM"},
            {"name": "Silchar", "state": "Assam", "district": "Cachar", "latitude": 24.8333, "longitude": 92.7789, "elevation_m": 22.0, "is_ner": True, "region_code": "NER_ASSAM"},
            {"name": "Shillong", "state": "Meghalaya", "district": "East Khasi Hills", "latitude": 25.5788, "longitude": 91.8933, "elevation_m": 1525.0, "is_ner": True, "region_code": "NER_MEGHALAYA"},
            {"name": "Cherrapunji (Sohra)", "state": "Meghalaya", "district": "East Khasi Hills", "latitude": 25.2745, "longitude": 91.7324, "elevation_m": 1430.0, "is_ner": True, "region_code": "NER_MEGHALAYA"},
            {"name": "Itanagar", "state": "Arunachal Pradesh", "district": "Papum Pare", "latitude": 27.0844, "longitude": 93.6053, "elevation_m": 320.0, "is_ner": True, "region_code": "NER_ARUNACHAL"},
            {"name": "Imphal", "state": "Manipur", "district": "Imphal West", "latitude": 24.8170, "longitude": 93.9368, "elevation_m": 786.0, "is_ner": True, "region_code": "NER_MANIPUR"},
            {"name": "Aizawl", "state": "Mizoram", "district": "Aizawl", "latitude": 23.7271, "longitude": 92.7176, "elevation_m": 1132.0, "is_ner": True, "region_code": "NER_MIZORAM"},
            {"name": "Kohima", "state": "Nagaland", "district": "Kohima", "latitude": 25.6751, "longitude": 94.1086, "elevation_m": 1444.0, "is_ner": True, "region_code": "NER_NAGALAND"},
            {"name": "Agartala", "state": "Tripura", "district": "West Tripura", "latitude": 23.8315, "longitude": 91.2868, "elevation_m": 16.0, "is_ner": True, "region_code": "NER_TRIPURA"},
            {"name": "Gangtok", "state": "Sikkim", "district": "East Sikkim", "latitude": 27.3389, "longitude": 88.6065, "elevation_m": 1650.0, "is_ner": True, "region_code": "NER_SIKKIM"},
            {"name": "New Delhi", "state": "Delhi", "district": "New Delhi", "latitude": 28.6139, "longitude": 77.2090, "elevation_m": 216.0, "is_ner": False, "region_code": "INDIA_NORTH"},
            {"name": "Mumbai", "state": "Maharashtra", "district": "Mumbai", "latitude": 19.0760, "longitude": 72.8777, "elevation_m": 14.0, "is_ner": False, "region_code": "INDIA_WEST"},
            {"name": "Kolkata", "state": "West Bengal", "district": "Kolkata", "latitude": 22.5726, "longitude": 88.3639, "elevation_m": 9.0, "is_ner": False, "region_code": "INDIA_EAST"},
            {"name": "Bengaluru", "state": "Karnataka", "district": "Bengaluru Urban", "latitude": 12.9716, "longitude": 77.5946, "elevation_m": 920.0, "is_ner": False, "region_code": "INDIA_SOUTH"},
            {"name": "Chennai", "state": "Tamil Nadu", "district": "Chennai", "latitude": 13.0827, "longitude": 80.2707, "elevation_m": 7.0, "is_ner": False, "region_code": "INDIA_SOUTH"},
            {"name": "Hyderabad", "state": "Telangana", "district": "Hyderabad", "latitude": 17.3850, "longitude": 78.4867, "elevation_m": 542.0, "is_ner": False, "region_code": "INDIA_SOUTH"},
            {"name": "Bhubaneswar", "state": "Odisha", "district": "Khordha", "latitude": 20.2961, "longitude": 85.8245, "elevation_m": 45.0, "is_ner": False, "region_code": "INDIA_EAST"},
            {"name": "Nagpur", "state": "Maharashtra", "district": "Nagpur", "latitude": 21.1458, "longitude": 79.0882, "elevation_m": 310.0, "is_ner": False, "region_code": "INDIA_WEST"},
            {"name": "Jaipur", "state": "Rajasthan", "district": "Jaipur", "latitude": 26.9124, "longitude": 75.7873, "elevation_m": 431.0, "is_ner": False, "region_code": "INDIA_NORTH"},
            {"name": "Kochi", "state": "Kerala", "district": "Ernakulam", "latitude": 9.9312, "longitude": 76.2673, "elevation_m": 4.0, "is_ner": False, "region_code": "INDIA_SOUTH"},
            {"name": "Panaji", "state": "Goa", "district": "North Goa", "latitude": 15.4909, "longitude": 73.8278, "elevation_m": 10.0, "is_ner": False, "region_code": "INDIA_WEST"},
            {"name": "Srinagar", "state": "Jammu & Kashmir", "district": "Srinagar", "latitude": 34.0837, "longitude": 74.7973, "elevation_m": 1585.0, "is_ner": False, "region_code": "INDIA_NORTH"},
            {"name": "Shimla", "state": "Himachal Pradesh", "district": "Shimla", "latitude": 31.1048, "longitude": 77.1734, "elevation_m": 2276.0, "is_ner": False, "region_code": "INDIA_NORTH"},
            {"name": "Patna", "state": "Bihar", "district": "Patna", "latitude": 25.5941, "longitude": 85.1376, "elevation_m": 53.0, "is_ner": False, "region_code": "INDIA_EAST"},
            {"name": "Lucknow", "state": "Uttar Pradesh", "district": "Lucknow", "latitude": 26.8467, "longitude": 80.9462, "elevation_m": 123.0, "is_ner": False, "region_code": "INDIA_NORTH"}
        ]
        
        for loc in locations_data:
            existing = db.query(Location).filter(Location.name == loc["name"]).first()
            if not existing:
                reg_id = region_map.get(loc["region_code"])
                db.add(Location(
                    name=loc["name"],
                    state=loc["state"],
                    district=loc["district"],
                    latitude=loc["latitude"],
                    longitude=loc["longitude"],
                    elevation_m=loc["elevation_m"],
                    is_ner=loc["is_ner"],
                    region_id=reg_id
                ))
                
        # 3. Seed Model Metadata
        models_data = [
            {
                "code": "NOAA_GFS",
                "name": "Global Forecast System (GFS)",
                "organization": "NOAA / NCEP (USA)",
                "model_type": "NWP",
                "spatial_resolution_deg": 0.25,
                "temporal_resolution_hours": 1,
                "attribution": "NOAA NCEP NOMADS Open Data",
                "is_operational": True
            },
            {
                "code": "ECMWF_IFS",
                "name": "Integrated Forecasting System (IFS)",
                "organization": "ECMWF (Europe)",
                "model_type": "NWP",
                "spatial_resolution_deg": 0.25,
                "temporal_resolution_hours": 1,
                "attribution": "ECMWF Open Data, WMO Essential",
                "is_operational": True
            },
            {
                "code": "ECMWF_AIFS",
                "name": "Artificial Intelligence Forecasting System (AIFS)",
                "organization": "ECMWF (Europe)",
                "model_type": "AI_ML",
                "spatial_resolution_deg": 0.25,
                "temporal_resolution_hours": 6,
                "attribution": "ECMWF Data-driven Deep Learning Model",
                "is_operational": True
            },
            {
                "code": "IMD_AWS",
                "name": "IMD In-Situ Automatic Weather Station Network",
                "organization": "India Meteorological Department (MoES)",
                "model_type": "OBSERVATION",
                "spatial_resolution_deg": 0.05,
                "temporal_resolution_hours": 1,
                "attribution": "IMD MoES Realized Weather",
                "is_operational": True
            },
            {
                "code": "MOSDAC_GSMAP",
                "name": "GSMaP_ISRO Satellite Precipitation",
                "organization": "ISRO / SAC / MOSDAC",
                "model_type": "SATELLITE",
                "spatial_resolution_deg": 0.10,
                "temporal_resolution_hours": 3,
                "attribution": "MOSDAC SAC ISRO Satellite Hydrology",
                "is_operational": False
            }
        ]
        
        for m in models_data:
            existing = db.query(ModelMetadata).filter(ModelMetadata.code == m["code"]).first()
            if not existing:
                db.add(ModelMetadata(**m))
                
        # 4. Seed Data Source Statuses
        sources_status = [
            {"source_name": "NOAA_GFS", "status": "CONNECTED", "endpoint_url": "https://nomads.ncep.noaa.gov", "license_attribution": "U.S. Public Domain"},
            {"source_name": "ECMWF_IFS", "status": "CONNECTED", "endpoint_url": "https://data.ecmwf.int", "license_attribution": "CC-BY 4.0 ECMWF Open Data"},
            {"source_name": "ECMWF_AIFS", "status": "CONNECTED", "endpoint_url": "https://data.ecmwf.int", "license_attribution": "CC-BY 4.0 ECMWF AIFS"},
            {"source_name": "IMD", "status": "CONNECTED", "endpoint_url": "https://mausam.imd.gov.in", "license_attribution": "India Meteorological Department (MoES)"},
            {"source_name": "MOSDAC", "status": "AUTH_REQUIRED", "endpoint_url": "https://mosdac.gov.in", "license_attribution": "ISRO MOSDAC Research Portal", "error_message": "User credentials (MOSDAC_USERNAME, MOSDAC_PASSWORD) required in .env"},
            {"source_name": "ERA5", "status": "CONNECTED", "endpoint_url": "https://archive-api.open-meteo.com/v1/archive", "license_attribution": "Copernicus Climate Change Service / ECMWF"},
        ]
        
        for s in sources_status:
            existing = db.query(DataSourceStatus).filter(DataSourceStatus.source_name == s["source_name"]).first()
            if not existing:
                db.add(DataSourceStatus(**s))
                
        db.commit()
        print("Database tables created and initialized successfully with regional and meteorological metadata.")
    except Exception as e:
        db.rollback()
        print("Error during database initialization:", e)
        raise
    finally:
        db.close()

if __name__ == "__main__":
    init_db()

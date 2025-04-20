#!/usr/bin/env node
const axios = require("axios")
const { createHash, createHmac } = require("node:crypto")
const { DateTime } = require("luxon")
const http = require("http")
const mysql = require("mysql")

const googleMapsClient = require("@google/maps").createClient({
  key: process.env.GOOGLE_PLACES_API_KEY,
  Promise,
})

class Mutex {
  mutex = Promise.resolve()

  lock = () =>
    new Promise((resolve) => {
      this.mutex = this.mutex.then(() => new Promise(resolve));
    })
}

const GEOCODE_MUTEX = new Mutex()

const NYC_OPEN_DATA_PORTAL_HOST = "https://data.cityofnewyork.us"
const NYC_OPEN_DATA_PORTAL_METADATA_PREFIX = `${NYC_OPEN_DATA_PORTAL_HOST}/api/views/metadata/v1/`

const PARKING_VIOLATIONS_FISCAL_YEAR_2014_PATH = "/resource/jt7v-77mi.json"
const PARKING_VIOLATIONS_FISCAL_YEAR_2015_PATH = "/resource/c284-tqph.json"
const PARKING_VIOLATIONS_FISCAL_YEAR_2016_PATH = "/resource/kiv2-tbus.json"
const PARKING_VIOLATIONS_FISCAL_YEAR_2017_PATH = "/resource/2bnn-yakx.json"
const PARKING_VIOLATIONS_FISCAL_YEAR_2018_PATH = "/resource/a5td-mswe.json"
const PARKING_VIOLATIONS_FISCAL_YEAR_2019_PATH = "/resource/faiq-9dfq.json"
const PARKING_VIOLATIONS_FISCAL_YEAR_2020_PATH = "/resource/p7t3-5i9s.json"
const PARKING_VIOLATIONS_FISCAL_YEAR_2021_PATH = "/resource/kvfd-bves.json"
const PARKING_VIOLATIONS_FISCAL_YEAR_2022_PATH = "/resource/7mxj-7a6y.json"
const PARKING_VIOLATIONS_FISCAL_YEAR_2023_PATH = "/resource/869v-vr48.json"
const PARKING_VIOLATIONS_FISCAL_YEAR_2024_PATH = "/resource/pvqr-7yc4.json"

const FISCAL_YEAR_PATHS = [
  PARKING_VIOLATIONS_FISCAL_YEAR_2014_PATH,
  PARKING_VIOLATIONS_FISCAL_YEAR_2015_PATH,
  PARKING_VIOLATIONS_FISCAL_YEAR_2016_PATH,
  PARKING_VIOLATIONS_FISCAL_YEAR_2017_PATH,
  PARKING_VIOLATIONS_FISCAL_YEAR_2018_PATH,
  PARKING_VIOLATIONS_FISCAL_YEAR_2019_PATH,
  PARKING_VIOLATIONS_FISCAL_YEAR_2020_PATH,
  PARKING_VIOLATIONS_FISCAL_YEAR_2021_PATH,
  PARKING_VIOLATIONS_FISCAL_YEAR_2022_PATH,
  PARKING_VIOLATIONS_FISCAL_YEAR_2023_PATH,
  PARKING_VIOLATIONS_FISCAL_YEAR_2024_PATH,
]
const OPEN_PARKING_AND_CAMERA_VIOLATIONS_PATH = "/resource/nc67-uf89.json"

const FISCAL_YEAR_PATHS_TO_DATABASE_NAMES_MAP = {
  [PARKING_VIOLATIONS_FISCAL_YEAR_2014_PATH]:
    "Parking Violations Issued - Fiscal Year 2014",
  [PARKING_VIOLATIONS_FISCAL_YEAR_2015_PATH]:
    "Parking Violations Issued - Fiscal Year 2015",
  [PARKING_VIOLATIONS_FISCAL_YEAR_2016_PATH]:
    "Parking Violations Issued - Fiscal Year 2016",
  [PARKING_VIOLATIONS_FISCAL_YEAR_2017_PATH]:
    "Parking Violations Issued - Fiscal Year 2017",
  [PARKING_VIOLATIONS_FISCAL_YEAR_2018_PATH]:
    "Parking Violations Issued - Fiscal Year 2018",
  [PARKING_VIOLATIONS_FISCAL_YEAR_2019_PATH]:
    "Parking Violations Issued - Fiscal Year 2019",
  [PARKING_VIOLATIONS_FISCAL_YEAR_2020_PATH]:
    "Parking Violations Issued - Fiscal Year 2020",
  [PARKING_VIOLATIONS_FISCAL_YEAR_2021_PATH]:
    "Parking Violations Issued - Fiscal Year 2021",
  [PARKING_VIOLATIONS_FISCAL_YEAR_2022_PATH]:
    "Parking Violations Issued - Fiscal Year 2022",
  [PARKING_VIOLATIONS_FISCAL_YEAR_2023_PATH]:
    "Parking Violations Issued - Fiscal Year 2023",
  [PARKING_VIOLATIONS_FISCAL_YEAR_2024_PATH]:
    "Parking Violations Issued - Fiscal Year 2024",
  [OPEN_PARKING_AND_CAMERA_VIOLATIONS_PATH]:
    "Open Parking and Camera Violations",
}

const API_LOOKUP_PATH = "/api/v1"
const EXISTING_LOOKUP_PATH = "/api/v1/lookup"

const SERVER_PORT = 8080
const LOCAL_SERVER_LOCATION = `localhost:${SERVER_PORT}`

const BUS_LANE_VIOLATION = "Bus Lane Violation"
const FAILURE_TO_STOP_AT_RED_LIGHT = "Failure to Stop at Red Light"
const MOBILE_BUS_LANE_VIOLATION = "Mobile Bus Lane Violation"
const SCHOOL_ZONE_SPEED_CAMERA_VIOLATION = "School Zone Speed Camera Violation"

const EXISTING_LOOKUP_SOURCE = "existing_lookup"

const FINE_FIELDS = [
  "total_fined",
  "total_reduced",
  "total_paid",
  "total_outstanding",
  "total_in_judgment",
]
const MAX_TWITTER_STATUS_LENGTH = 280

const US_DOLLAR_FORMAT_OBJECT = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
})

const CAMERA_THRESHOLDS = {
  camera_violations: 5,
  red_light_camera_violations: 5,
  school_zone_speed_camera_violations: 15,
}

const HOWS_MY_DRIVING_NY_WEBSITE_URL = "https://howsmydrivingny.nyc"

// humanized names for violations
const openParkingAndCameraViolationsReadableViolationDescriptions = {
  "": "No Description Given",
  "ALTERING INTERCITY BUS PERMIT": "Altered Intercity Bus Permit",
  "ANGLE PARKING": "No Angle Parking",
  "ANGLE PARKING-COMM VEHICLE": "No Angle Parking",
  "BEYOND MARKED SPACE": "No Parking Beyond Marked Space",
  "BIKE LANE": "Blocking Bike Lane",
  "BLUE ZONE": "No Parking - Blue Zone",
  "BUS LANE VIOLATION": BUS_LANE_VIOLATION,
  "BUS PARKING IN LOWER MANHATTAN": "Bus Parking in Lower Manhattan",
  "COMML PLATES-UNALTERED VEHICLE": "Commercial Plates on Unaltered Vehicle",
  CROSSWALK: "Blocking Crosswalk",
  "DETACHED TRAILER": "Detached Trailer",
  "DIVIDED HIGHWAY": "No Stopping - Divided Highway",
  "DOUBLE PARKING": "Double Parking",
  "DOUBLE PARKING-MIDTOWN COMML": "Double Parking - Midtown Commercial Zone",
  "ELEVATED/DIVIDED HIGHWAY/TUNNL":
    "No Stopping in Tunnel or on Elevated Highway",
  "EXCAVATION-VEHICLE OBSTR TRAFF":
    "No Stopping - Adjacent to Street Construction",
  "EXPIRED METER": "Expired Meter",
  "EXPIRED METER-COMM METER ZONE": "Expired Meter - Commercial Meter Zone",
  "EXPIRED MUNI METER": "Expired Meter",
  "EXPIRED MUNI MTR-COMM MTR ZN": "Expired Meter - Commercial Meter Zone",
  "FAIL TO DISP. MUNI METER RECPT": "Failure to Display Meter Receipt",
  "FAIL TO DSPLY MUNI METER RECPT": "Failure to Display Meter Receipt",
  "FAILURE TO DISPLAY BUS PERMIT": "Failure to Display Bus Permit",
  "FAILURE TO STOP AT RED LIGHT": FAILURE_TO_STOP_AT_RED_LIGHT,
  "FEEDING METER": "Feeding Meter",
  "FIRE HYDRANT": "Fire Hydrant",
  "FRONT OR BACK PLATE MISSING": "Front or Back Plate Missing",
  IDLING: "Idling",
  "IMPROPER REGISTRATION": "Improper Registration",
  "INSP STICKER-MUTILATED/C'FEIT":
    "Inspection Sticker Mutilated or Counterfeit",
  "INSP. STICKER-EXPIRED/MISSING": "Inspection Sticker Expired or Missing",
  INTERSECTION: "No Stopping - Intersection",
  "MARGINAL STREET/WATER FRONT": "No Parking on Marginal Street or Waterfront",
  "MIDTOWN PKG OR STD-3HR LIMIT": "Midtown Parking or Standing - 3 Hour Limit",
  MISCELLANEOUS: "Miscellaneous",
  "MISSING EQUIPMENT": "Missing Required Equipment",
  "MISUSE PARKING PERMIT": "Misuse of Parking Permit",
  "NGHT PKG ON RESID STR-COMM VEH":
    "No Nighttime Parking on Residential Street - Commercial Vehicle",
  "NIGHTTIME STD/ PKG IN A PARK": "No Nighttime Standing or Parking in a Park",
  "NO MATCH-PLATE/STICKER": "Plate and Sticker Do Not Match",
  "NO OPERATOR NAM/ADD/PH DISPLAY": "Failure to Display Operator Information",
  "NO PARKING-DAY/TIME LIMITS": "No Parking - Day/Time Limits",
  "NO PARKING-EXC. AUTH. VEHICLE": "No Parking - Except Authorized Vehicles",
  "NO PARKING-EXC. HNDICAP PERMIT": "No Parking - Except Disability Permit",
  "NO PARKING-EXC. HOTEL LOADING": "No Parking - Except Hotel Loading",
  "NO PARKING-STREET CLEANING": "No Parking - Street Cleaning",
  "NO PARKING-TAXI STAND": "No Parking - Taxi Stand",
  "NO STANDING EXCP D/S": "No Standing - Except Department of State",
  "NO STANDING EXCP DP": "No Standing - Except Diplomat",
  "NO STANDING-BUS LANE": "No Standing - Bus Lane",
  "NO STANDING-BUS STOP": "No Standing - Bus Stop",
  "NO STANDING-COMM METER ZONE": "No Standing - Commercial Meter Zone",
  "NO STANDING-COMMUTER VAN STOP": "No Standing - Commuter Van Stop",
  "NO STANDING-DAY/TIME LIMITS": "No Standing - Day/Time Limits",
  "NO STANDING-EXC. AUTH. VEHICLE": "No Standing - Except Authorized Vehicle",
  "NO STANDING-EXC. TRUCK LOADING": "No Standing - Except Truck Loading",
  "NO STANDING-FOR HIRE VEH STOP": "No Standing - For Hire Vehicle Stop",
  "NO STANDING-HOTEL LOADING": "No Standing - Hotel Loading",
  "NO STANDING-OFF-STREET LOT": "No Standing - Off-Street Lot",
  "NO STANDING-SNOW EMERGENCY": "No Standing - Snow Emergency",
  "NO STANDING-TAXI STAND": "No Standing - Taxi Stand",
  "NO STD(EXC TRKS/GMTDST NO-TRK)":
    "No Standing - Except Trucks in Garment District",
  "NO STOP/STANDNG EXCEPT PAS P/U":
    "No Stopping or Standing Except for Passenger Pick-Up",
  "NO STOPPING-DAY/TIME LIMITS": "No Stopping - Day/Time Limits",
  "NON-COMPLIANCE W/ POSTED SIGN": "Non-Compliance with Posted Sign",
  "OBSTRUCTING DRIVEWAY": "Obstructing Driveway",
  "OBSTRUCTING TRAFFIC/INTERSECT": "Obstructing Traffic or Intersection",
  "OT PARKING-MISSING/BROKEN METR":
    "Overtime Parking at Missing or Broken Meter",
  OTHER: "Other",
  "OVERNIGHT TRACTOR TRAILER PKG": "Overnight Parking of Tractor Trailer",
  "OVERTIME PKG-TIME LIMIT POSTED": "Overtime Parking - Time Limit Posted",
  "OVERTIME STANDING DP": "Overtime Standing - Diplomat",
  "OVERTIME STDG D/S": "Overtime Standing - Department of State",
  "PARKED BUS-EXC. DESIG. AREA": "Bus Parking Outside of Designated Area",
  "PEDESTRIAN RAMP": "Blocking Pedestrian Ramp",
  "PHTO SCHOOL ZN SPEED VIOLATION": SCHOOL_ZONE_SPEED_CAMERA_VIOLATION,
  "PKG IN EXC. OF LIM-COMM MTR ZN":
    "Parking in Excess of Limits - Commercial Meter Zone",
  "PLTFRM LFTS LWRD POS COMM VEH":
    "Commercial Vehicle Platform Lifts in Lowered Position",
  "RAILROAD CROSSING": "No Stopping - Railroad Crossing",
  "REG STICKER-MUTILATED/C'FEIT":
    "Registration Sticker Mutilated or Counterfeit",
  "REG. STICKER-EXPIRED/MISSING": "Registration Sticker Expired or Missing",
  "REMOVE/REPLACE FLAT TIRE": "Replacing Flat Tire on Major Roadway",
  "SAFETY ZONE": "No Standing - Safety Zone",
  "SELLING/OFFERING MCHNDSE-METER":
    "Selling or Offering Merchandise From Metered Parking",
  SIDEWALK: "Parked on Sidewalk",
  "STORAGE-3HR COMMERCIAL": "Street Storage of Commercial Vehicle Over 3 Hours",
  "TRAFFIC LANE": "No Stopping - Traffic Lane",
  "TUNNEL/ELEVATED/ROADWAY": "No Stopping in Tunnel or on Elevated Highway",
  "UNALTERED COMM VEH-NME/ADDRESS": "Commercial Plates on Unaltered Vehicle",
  "UNALTERED COMM VEHICLE": "Commercial Plates on Unaltered Vehicle",
  "UNAUTHORIZED BUS LAYOVER": "Bus Layover in Unauthorized Location",
  "UNAUTHORIZED PASSENGER PICK-UP": "Unauthorized Passenger Pick-Up",
  "VACANT LOT": "No Parking - Vacant Lot",
  "VEH-SALE/WSHNG/RPRNG/DRIVEWAY":
    "No Parking on Street to Wash or Repair Vehicle",
  "VEHICLE FOR SALE(DEALERS ONLY)":
    "No Parking on Street to Display Vehicle for Sale",
  "VIN OBSCURED": "Vehicle Identification Number Obscured",
  "WASH/REPAIR VEHCL-REPAIR ONLY":
    "No Parking on Street to Wash or Repair Vehicle",
  "WEIGH IN MOTION VIOLATION": "Weigh in Motion Violation",
  "WRONG WAY": "No Parking Opposite Street Direction",
}

// humanized names for violations
const fiscalYearReadableViolationDescriptions = {
  "1": "Failure to Display Bus Permit",
  "01": "Failure to Display Bus Permit",
  "2": "Failure to Display Operator Information",
  "02": "Failure to Display Operator Information",
  "3": "Unauthorized Passenger Pick-Up",
  "03": "Unauthorized Passenger Pick-Up",
  "4": "Bus Parking in Lower Manhattan - Exceeded 3-Hour limit",
  "04": "Bus Parking in Lower Manhattan - Exceeded 3-Hour limit",
  "04A": "Bus Parking in Lower Manhattan - Non-Bus",
  "04B": "Bus Parking in Lower Manhattan - No Permit",
  5: BUS_LANE_VIOLATION,
  "05": BUS_LANE_VIOLATION,
  "6": "Overnight Parking of Tractor Trailer",
  "06": "Overnight Parking of Tractor Trailer",
  7: FAILURE_TO_STOP_AT_RED_LIGHT,
  "07": FAILURE_TO_STOP_AT_RED_LIGHT,
  "8": "Idling",
  "08": "Idling",
  "9": "Obstructing Traffic or Intersection",
  "09": "Obstructing Traffic or Intersection",
  10: "No Stopping or Standing Except for Passenger Pick-Up",
  11: "No Parking - Except Hotel Loading",
  12: [
    {
      description: "No Standing - Snow Emergency",
      startDate: new Date(1970, 0, 1),
    },
    {
      description: MOBILE_BUS_LANE_VIOLATION,
      startDate: new Date(2019, 11, 6),
    },
  ],
  13: "No Standing - Taxi Stand",
  14: "No Standing - Day/Time Limits",
  15: [
    {
      description: "No Standing - Off-Street Lot",
      startDate: new Date(1970, 0, 1),
    },
    {
      description: "Mobile MTA Double Parking Violation",
      startDate: new Date(2024, 7, 19),
    },
  ],
  16: "No Standing - Except Truck Loading/Unloading",
  "16A": "No Standing - Except Truck Loading/Unloading",
  17: "No Parking - Except Authorized Vehicles",
  18: "No Standing - Bus Lane",
  19: "No Standing - Bus Stop",
  20: "No Parking - Day/Time Limits",
  "20A": "No Parking - Day/Time Limits",
  21: "No Parking - Street Cleaning",
  22: "No Parking - Except Hotel Loading",
  23: "No Parking - Taxi Stand",
  24: "No Parking - Except Authorized Vehicles",
  25: "No Standing - Commuter Van Stop",
  26: "No Standing - For Hire Vehicle Stop",
  27: "No Parking - Except Disability Permit",
  28: "Overtime Standing - Diplomat",
  29: "Altered Intercity Bus Permit",
  30: "No Stopping/Standing",
  31: "No Standing - Commercial Meter Zone",
  32: "Overtime Parking at Missing or Broken Meter",
  "32A": "Overtime Parking at Missing or Broken Meter",
  33: [
    {
      description: "Feeding Meter",
      startDate: new Date(1970, 0, 1),
    },
    {
      description: "Misuse of Parking Permit",
      startDate: new Date(2019, 5, 11),
    },
  ],
  35: "Selling or Offering Merchandise From Metered Parking",
  36: SCHOOL_ZONE_SPEED_CAMERA_VIOLATION,
  37: "Expired Meter",
  38: "Failure to Display Meter Receipt",
  39: "Overtime Parking - Time Limit Posted",
  40: "Fire Hydrant",
  42: "Expired Meter - Commercial Meter Zone",
  43: [
    {
      description: "Expired Meter - Commercial Meter Zone",
      startDate: new Date(1970, 0, 1),
    },
    {
      description: "Mobile MTA Bus Stop Violation",
      startDate: new Date(2024, 7, 19),
    },
  ],
  44: "Overtime Parking - Commercial Meter Zone",
  45: "No Stopping - Traffic Lane",
  46: "Double Parking",
  "46A": "Double Parking",
  "46B": "Double Parking - Within 100 ft. of Loading Zone",
  47: "Double Parking - Midtown Commercial Zone",
  "47A": "Double Parking - Angle Parking",
  48: "Blocking Bike Lane",
  49: "No Stopping - Adjacent to Street Construction",
  50: "Blocking Crosswalk",
  51: "Parked on Sidewalk",
  52: "No Stopping - Intersection",
  53: "No Standing - Safety Zone",
  55: "No Stopping in Tunnel or on Elevated Highway",
  56: "No Stopping - Divided Highway",
  57: [
    {
      description: "No Parking - Blue Zone",
      startDate: new Date(1970, 0, 1),
    },
    {
      description: "Weigh in Motion Violation",
      startDate: new Date(2023, 9, 1),
    },
  ],
  58: "No Parking on Marginal Street or Waterfront",
  59: "No Angle Parking",
  60: "No Angle Parking",
  61: "No Parking Opposite Street Direction",
  62: "No Parking Beyond Marked Space",
  63: "No Nighttime Standing or Parking in a Park",
  64: "No Standing - Consul or Diplomat",
  65: "Overtime Standing - Consul or Diplomat Over 30 Minutes",
  66: "Detached Trailer",
  67: "Blocking Pedestrian Ramp",
  68: "Non-Compliance with Posted Sign",
  69: "Failure to Display Meter Receipt",
  70: "Registration Sticker Expired or Missing",
  "70A": "Registration Sticker Expired or Missing",
  "70B": "Improper Display of Registration",
  71: "Inspection Sticker Expired or Missing",
  "71A": "Inspection Sticker Expired or Missing",
  "71B": "Improper Safety Sticker",
  72: "Inspection Sticker Mutilated or Counterfeit",
  "72A": "Inspection Sticker Mutilated or Counterfeit",
  73: "Registration Sticker Mutilated or Counterfeit",
  "73A": "Registration Sticker Mutilated or Counterfeit",
  74: "Front or Back Plate Missing",
  "74A": "Improperly Displayed Plate",
  "74B": "Covered Plate",
  75: "Plate and Sticker Do Not Match",
  77: "Bus Parking Outside of Designated Area",
  78: "Nighttime Parking on Residential Street - Commercial Vehicle",
  79: "Bus Layover in Unauthorized Location",
  80: "Missing Required Equipment",
  81: "No Standing - Except Diplomat",
  82: "Commercial Plates on Unaltered Vehicle",
  83: "Improper Registration",
  84: "Commercial Vehicle Platform Lifts in Lowered Position",
  85: "Street Storage of Commercial Vehicle Over 3 Hours",
  86: "Midtown Parking or Standing - 3 Hour Limit",
  87: "Fraudulent Use of Agency Parking Permit",
  89: "No Standing - Except Trucks in Garment District",
  91: "No Parking on Street to Display Vehicle for Sale",
  92: "No Parking on Street to Wash or Repair Vehicle",
  93: "Replacing Flat Tire on Major Roadway",
  94: "NYPD Tow Pound Release Fine",
  96: "No Stopping - Railroad Crossing",
  97: "Parking in a Vacant Lot",
  98: "Obstructing Driveway",
  "01-No Intercity Pmt Displ": "Failure to Display Bus Permit",
  "02-No operator N/A/PH": "Failure to Display Operator Information",
  "03-Unauth passenger pick-up": "Unauthorized Passenger Pick-Up",
  "04-Downtown Bus Area,3 Hr Lim":
    "Bus Parking in Lower Manhattan - Exceeded 3-Hour limit",
  "04A-Downtown Bus Area,Non-Bus": "Bus Parking in Lower Manhattan - Non-Bus",
  "04A-Downtown Bus Area, Non-Bus": "Bus Parking in Lower Manhattan - Non-Bus",
  "04B-Downtown Bus Area,No Prmt": "Bus Parking in Lower Manhattan - No Permit",
  "06-Nighttime PKG (Trailer)": "Overnight Parking of Tractor Trailer",
  "08-Engine Idling": "Idling",
  "09-Blocking the Box": "Obstructing Traffic or Intersection",
  "10-No Stopping": "No Stopping or Standing Except for Passenger Pick-Up",
  "11-No Stand (exc hotel load)": "No Parking - Except Hotel Loading",
  "12-No Stand (snow emergency)": "No Standing - Snow Emergency",
  "13-No Stand (taxi stand)": "No Standing - Taxi Stand",
  "14-No Standing": "No Standing - Day/Time Limits",
  "16-No Std (Com Veh) Com Plate":
    "No Standing - Except Truck Loading/Unloading",
  "16A-No Std (Com Veh) Non-COM":
    "No Standing - Except Truck Loading/Unloading",
  "17-No Stand (exc auth veh)": "No Parking - Except Authorized Vehicles",
  "18-No Stand (bus lane)": "No Standing - Bus Lane",
  "19-No Stand (bus stop)": "No Standing - Bus Stop",
  "20-No Parking (Com Plate)": "No Parking - Day/Time Limits",
  "20A-No Parking (Non-COM)": "No Parking - Day/Time Limits",
  "21-No Parking (street clean)": "No Parking - Street Cleaning",
  "22-No Parking (exc hotel load)": "No Parking - Except Hotel Loading",
  "23-No Parking (taxi stand)": "No Parking - Taxi Stand",
  "24-No Parking (exc auth veh)": "No Parking - Except Authorized Vehicles",
  "25-No Stand (commutr van stop)": "No Standing - Commuter Van Stop",
  "26-No Stnd (for-hire veh only)": "No Standing - For Hire Vehicle Stop",
  "27-No Parking (exc handicap)": "No Parking - Except Disability Permit",
  "28-O/T STD,PL/Con,0 Mn, Dec": "Overtime Standing - Diplomat",
  "29-Altered Intercity bus pmt": "Altered Intercity Bus Permit",
  "30-No stopping/standing": "No Stopping/Standing",
  "31-No Stand (Com. Mtr. Zone)": "No Standing - Commercial Meter Zone",
  "32-Overtime PKG-Missing Meter":
    "Overtime Parking at Missing or Broken Meter",
  "32A Overtime PKG-Broken Meter":
    "Overtime Parking at Missing or Broken Meter",
  "33-Feeding Meter": "Feeding Meter",
  "35-Selling/Offer Merchandise":
    "Selling or Offering Merchandise From Metered Parking",
  "37-Expired Muni Meter": "Expired Meter",
  "37-Expired Parking Meter": "Expired Meter",
  "38-Failure to Display Muni Rec": "Failure to Display Meter Receipt",
  "38-Failure to Dsplay Meter Rec": "Failure to Display Meter Receipt",
  "39-Overtime PKG-Time Limt Post": "Overtime Parking - Time Limit Posted",
  "40-Fire Hydrant": "Fire Hydrant",
  "42-Exp. Muni-Mtr (Com. Mtr. Z)": "Expired Meter - Commercial Meter Zone",
  "42-Exp Meter (Com Zone)": "Expired Meter - Commercial Meter Zone",
  "43-Exp. Mtr. (Com. Mtr. Zone)": "Expired Meter - Commercial Meter Zone",
  "44-Exc Limit (Com. Mtr. Zone)": "Overtime Parking - Commercial Meter Zone",
  "45-Traffic Lane": "No Stopping - Traffic Lane",
  "46-Double Parking (Com Plate)": "Double Parking",
  "46A-Double Parking (Non-COM)": "Double Parking",
  "46B-Double Parking (Com-100Ft)":
    "Double Parking - Within 100 ft. of Loading Zone",
  "47-Double PKG-Midtown": "Double Parking - Midtown Commercial Zone",
  "47A-Angle PKG - Midtown": "Double Parking - Angle Parking",
  "48-Bike Lane": "Blocking Bike Lane",
  "49-Excavation (obstruct traff)":
    "No Stopping - Adjacent to Street Construction",
  "50-Crosswalk": "Blocking Crosswalk",
  "51-Sidewalk": "Parked on Sidewalk",
  "52-Intersection": "No Stopping - Intersection",
  "53-Safety Zone": "No Standing - Safety Zone",
  "55-Tunnel/Elevated Roadway": "No Stopping in Tunnel or on Elevated Highway",
  "56-Divided Highway": "No Stopping - Divided Highway",
  "57-Blue Zone": "No Parking - Blue Zone",
  "58-Marginal Street/Water Front":
    "No Parking on Marginal Street or Waterfront",
  "59-Angle PKG-Commer. Vehicle": "No Angle Parking",
  "60-Angle Parking": "No Angle Parking",
  "61-Wrong Way": "No Parking Opposite Street Direction",
  "62-Beyond Marked Space": "No Parking Beyond Marked Space",
  "63-Nighttime STD/PKG in a Park":
    "No Nighttime Standing or Parking in a Park",
  "64-No STD Ex Con/DPL,D/S Dec": "No Standing - Consul or Diplomat",
  "65-O/T STD,pl/Con,0 Mn,/S":
    "Overtime Standing - Consul or Diplomat Over 30 Minutes",
  "66-Detached Trailer": "Detached Trailer",
  "67-Blocking Ped. Ramp": "Blocking Pedestrian Ramp",
  "68-Not Pkg. Comp. w Psted Sign": "Non-Compliance with Posted Sign",
  "69-Failure to Disp Muni Recpt": "Failure to Display Meter Receipt",
  "69-Fail to Dsp Prking Mtr Rcpt": "Failure to Display Meter Receipt",
  "70-Reg. Sticker Missing (NYS)": "Registration Sticker Expired or Missing",
  "70A-Reg. Sticker Expired (NYS)": "Registration Sticker Expired or Missing",
  "70B-Impropr Dsply of Reg (NYS)": "Improper Display of Registration",
  "71-Insp. Sticker Missing (NYS": "Inspection Sticker Expired or Missing",
  "71A-Insp Sticker Expired (NYS)": "Inspection Sticker Expired or Missing",
  "71B-Improp Safety Stkr (NYS)": "Improper Safety Sticker",
  "72-Insp Stkr Mutilated": "Inspection Sticker Mutilated or Counterfeit",
  "72A-Insp Stkr Counterfeit": "Inspection Sticker Mutilated or Counterfeit",
  "73-Reg Stkr Mutilated": "Registration Sticker Mutilated or Counterfeit",
  "73A-Reg Stkr Counterfeit": "Registration Sticker Mutilated or Counterfeit",
  "74-Missing Display Plate": "Front or Back Plate Missing",
  "74A-Improperly Displayed Plate": "Improperly Displayed Plate",
  "74B-Covered Plate": "Covered Plate",
  "75-No Match-Plate/Reg. Sticker": "Plate and Sticker Do Not Match",
  "77-Parked Bus (exc desig area)": "Bus Parking Outside of Designated Area",
  "78-Nighttime PKG on Res Street":
    "Nighttime Parking on Residential Street - Commercial Vehicle",
  "79-Bus Layover": "Bus Layover in Unauthorized Location",
  "80-Missing Equipment (specify)": "Missing Required Equipment",
  "81-No STD Ex C,&D Dec,30 Mn": "No Standing - Except Diplomat",
  "82-Unaltered Commerc Vehicle": "Commercial Plates on Unaltered Vehicle",
  "83-Improper Registration": "Improper Registration",
  "84-Platform lifts in low posit":
    "Commercial Vehicle Platform Lifts in Lowered Position",
  "85-Storage-3 hour Commercial":
    "Street Storage of Commercial Vehicle Over 3 Hours",
  "86-Midtown PKG or STD-3 hr lim":
    "Midtown Parking or Standing - 3 Hour Limit",
  "89-No Stand Exc Com Plate":
    "No Standing - Except Trucks in Garment District",
  "91-Veh for Sale (Dealer Only)":
    "No Parking on Street to Display Vehicle for Sale",
  "92-Washing/Repairing Vehicle":
    "No Parking on Street to Wash or Repair Vehicle",
  "93-Repair Flat Tire (Maj Road)": "Replacing Flat Tire on Major Roadway",
  "96-Railroad Crossing": "No Stopping - Railroad Crossing",
  "98-Obstructing Driveway": "Obstructing Driveway",
  "BUS LANE VIOLATION": BUS_LANE_VIOLATION,
  "FAILURE TO STOP AT RED LIGHT": FAILURE_TO_STOP_AT_RED_LIGHT,
  "Field Release Agreement": "Field Release Agreement",
  "PHTO SCHOOL ZN SPEED VIOLATION": SCHOOL_ZONE_SPEED_CAMERA_VIOLATION,
}

// mapping humanized naes to violation codes
const namesToCodes = {
  "Failure to Display Bus Permit": "01",
  "Failure to Display Operator Information": "02",
  "Unauthorized Passenger Pick-Up": "03",
  "Bus Parking in Lower Manhattan - Exceeded 3-Hour limit": "04",
  "Bus Parking in Lower Manhattan - Non-Bus": "04A",
  "Bus Parking in Lower Manhattan - No Permit": "04B",
  [BUS_LANE_VIOLATION]: "05",
  "Overnight Parking of Tractor Trailer": "06",
  [FAILURE_TO_STOP_AT_RED_LIGHT]: "07",
  Idling: "08",
  "Obstructing Traffic or Intersection": "09",
  "No Stopping or Standing Except for Passenger Pick-Up": "10",
  [MOBILE_BUS_LANE_VIOLATION]: "12",
  "No Standing - Snow Emergency": "12",
  "No Standing - Taxi Stand": "13",
  "No Standing - Day/Time Limits": "14",
  "Mobile MTA Double Parking Violation": "15",
  "No Standing - Off-Street Lot": "15",
  "No Standing - Except Truck Loading/Unloading": "16",
  "No Standing - Bus Lane": "18",
  "No Standing - Bus Stop": "19",
  "No Parking - Day/Time Limits": "20",
  "No Parking - Street Cleaning": "21",
  "No Parking - Except Hotel Loading": "22",
  "No Parking - Taxi Stand": "23",
  "No Parking - Except Authorized Vehicles": "24",
  "No Standing - Commuter Van Stop": "25",
  "No Standing - For Hire Vehicle Stop": "26",
  "No Parking - Except Disability Permit": "27",
  "Overtime Standing - Diplomat": "28",
  "Altered Intercity Bus Permit": "29",
  "No Stopping/Standing": "30",
  "No Standing - Commercial Meter Zone": "31",
  "Overtime Parking at Missing or Broken Meter": "32",
  "Feeding Meter": "33",
  "Misuse of Parking Permit": "33",
  "Selling or Offering Merchandise From Metered Parking": "35",
  [SCHOOL_ZONE_SPEED_CAMERA_VIOLATION]: "36",
  "Expired Meter": "37",
  "Failure to Display Meter Receipt": "69",
  "Overtime Parking - Time Limit Posted": "39",
  "Fire Hydrant": "40",
  "Expired Meter - Commercial Meter Zone": "43",
  "Mobile MTA Bus Stop Violation": "43",
  "Overtime Parking - Commercial Meter Zone": "44",
  "No Stopping - Traffic Lane": "45",
  "Double Parking": "46",
  "Double Parking - Within 100 ft. of Loading Zone": "46B",
  "Double Parking - Midtown Commercial Zone": "47",
  "Double Parking - Angle Parking": "47A",
  "Blocking Bike Lane": "48",
  "No Stopping - Adjacent to Street Construction": "49",
  "Blocking Crosswalk": "50",
  "Parked on Sidewalk": "51",
  "No Stopping - Intersection": "52",
  "No Standing - Safety Zone": "53",
  "No Stopping in Tunnel or on Elevated Highway": "55",
  "No Stopping - Divided Highway": "56",
  "No Parking - Blue Zone": "57",
  "Weigh in Motion Violation": "57",
  "No Parking on Marginal Street or Waterfront": "58",
  "No Angle Parking": "60",
  "No Parking Opposite Street Direction": "61",
  "No Parking Beyond Marked Space": "62",
  "No Nighttime Standing or Parking in a Park": "63",
  "No Standing - Consul or Diplomat": "64",
  "Overtime Standing - Consul or Diplomat Over 30 Minutes": "65",
  "Detached Trailer": "66",
  "Blocking Pedestrian Ramp": "67",
  "Non-Compliance with Posted Sign": "68",
  "Registration Sticker Expired or Missing": "70",
  "Improper Display of Registration": "70B",
  "Inspection Sticker Expired or Missing": "71",
  "Improper Safety Sticker": "71B",
  "Inspection Sticker Mutilated or Counterfeit": "72",
  "Registration Sticker Mutilated or Counterfeit": "73",
  "Front or Back Plate Missing": "74",
  "Improperly Displayed Plate": "74A",
  "Covered Plate": "74B",
  "Plate and Sticker Do Not Match": "75",
  "Bus Parking Outside of Designated Area": "77",
  "Nighttime Parking on Residential Street - Commercial Vehicle": "78",
  "Bus Layover in Unauthorized Location": "79",
  "Missing Required Equipment": "80",
  "No Standing - Except Diplomat": "81",
  "Commercial Plates on Unaltered Vehicle": "82",
  "Improper Registration": "83",
  "Commercial Vehicle Platform Lifts in Lowered Position": "84",
  "Street Storage of Commercial Vehicle Over 3 Hours": "85",
  "Midtown Parking or Standing - 3 Hour Limit": "86",
  "Fraudulent Use of Agency Parking Permit": "87",
  "No Standing - Except Trucks in Garment District": "89",
  "No Parking on Street to Display Vehicle for Sale": "91",
  "No Parking on Street to Wash or Repair Vehicle": "92",
  "Replacing Flat Tire on Major Roadway": "93",
  "NYPD Tow Pound Release Fine": "94",
  "No Stopping - Railroad Crossing": "96",
  "Parking in a Vacant Lot": "97",
  "Obstructing Driveway": "98",
}

const stateAbbrRegex =
  /^(99|AB|AK|AL|AR|AZ|BC|CA|CO|CT|DC|DE|DP|FL|FM|FO|GA|GU|GV|HI|IA|ID|IL|IN|KS|KY|LA|MA|MB|MD|ME|MI|MN|MO|MP|MS|MT|MX|NB|NC|ND|NE|NF|NH|NJ|NM|NS|NT|NV|NY|OH|OK|ON|OR|PA|PE|PR|PW|QC|RI|SC|SD|SK|TN|TX|UT|VA|VI|VT|WA|WI|WV|WY|YT)$/
const registrationTypesRegex =
  /^(AGC|AGR|AMB|APP|ARG|ATD|ATV|AYG|BOB|BOT|CBS|CCK|CHC|CLG|CMB|CME|CMH|COM|CSP|DLR|FAR|FPW|GAC|GSM|HAC|HAM|HIR|HIS|HOU|HSM|IRP|ITP|JCA|JCL|JSC|JWV|LMA|LMB|LMC|LOC|LTR|LUA|MCD|MCL|MED|MOT|NLM|NYA|NYC|NYS|OMF|OML|OMO|OMR|OMS|OMT|OMV|ORC|ORG|ORM|PAS|PHS|PPH|PSD|RGC|RGL|SCL|SEM|SNO|SOS|SPC|SPO|SRF|SRN|STA|STG|SUP|THC|TOW|TRA|TRC|TRL|USC|USS|VAS|VPL|WUG)$/

const placenameRegex =
  /\s((?:st(?:\.|reet)?|dr(?:\.|ive)?|pl(?:\.|ace)?|(avenue (?![A-Za-z]))|(av (?![A-Za-z]))|(av. (?![A-Za-z]))|(ave (?![A-Za-z]))|(ave. (?![A-Za-z]))|av$|av\.$|ave$|ave\.$|avenue$|l(?:a)?n(?:e)?|rd|road|lane|drive|way|(court(?!\sSt(reet)?))|plaza|square|run|parkway|point|pike|square|driveway|trace|terrace|blvd|crescent))/i

const BRONX = "Bronx"
const BROOKLYN = "Brooklyn"
const MANHATTAN = "Manhattan"
const QUEENS = "Queens"
const STATEN_ISLAND = "Staten Island"

const counties = {
  BRONX: BRONX,
  Bronx: BRONX,
  BROOK: BROOKLYN,
  Brook: BROOKLYN,
  BX: BRONX,
  Bx: BRONX,
  BK: BROOKLYN,
  Bk: BROOKLYN,
  K: BROOKLYN,
  KINGS: BROOKLYN,
  Kings: BROOKLYN,
  MAH: MANHATTAN,
  MANHA: MANHATTAN,
  MN: MANHATTAN,
  NEUY: MANHATTAN,
  NY: MANHATTAN,
  PBX: BRONX,
  PK: BROOKLYN,
  PNY: MANHATTAN,
  Q: QUEENS,
  QN: QUEENS,
  QNS: QUEENS,
  Qns: QUEENS,
  QUEEN: QUEENS,
  Queen: QUEENS,
  R: STATEN_ISLAND,
  RICH: STATEN_ISLAND,
  Rich: STATEN_ISLAND,
  ST: STATEN_ISLAND,
}

const precinctsByBorough = {
  '1': MANHATTAN,
  '5': MANHATTAN,
  '6': MANHATTAN,
  '7': MANHATTAN,
  '9': MANHATTAN,
  '10': MANHATTAN,
  '13': MANHATTAN,
  '14': MANHATTAN,
  '17': MANHATTAN,
  '18': MANHATTAN,
  '19': MANHATTAN,
  '20': MANHATTAN,
  '22': MANHATTAN,
  '23': MANHATTAN,
  '24': MANHATTAN,
  '25': MANHATTAN,
  '26': MANHATTAN,
  '28': MANHATTAN,
  '30': MANHATTAN,
  '32': MANHATTAN,
  '33': MANHATTAN,
  '34': MANHATTAN,
  '40': BRONX,
  '41': BRONX,
  '42': BRONX,
  '43': BRONX,
  '44': BRONX,
  '45': BRONX,
  '46': BRONX,
  '47': BRONX,
  '48': BRONX,
  '49': BRONX,
  '50': BRONX,
  '52': BRONX,
  '60': BROOKLYN,
  '61': BROOKLYN,
  '62': BROOKLYN,
  '63': BROOKLYN,
  '66': BROOKLYN,
  '67': BROOKLYN,
  '68': BROOKLYN,
  '69': BROOKLYN,
  '70': BROOKLYN,
  '71': BROOKLYN,
  '72': BROOKLYN,
  '73': BROOKLYN,
  '75': BROOKLYN,
  '76': BROOKLYN,
  '77': BROOKLYN,
  '78': BROOKLYN,
  '79': BROOKLYN,
  '81': BROOKLYN,
  '83': BROOKLYN,
  '84': BROOKLYN,
  '88': BROOKLYN,
  '90': BROOKLYN,
  '94': BROOKLYN,
  '100': QUEENS,
  '101': QUEENS,
  '102': QUEENS,
  '103': QUEENS,
  '104': QUEENS,
  '105': QUEENS,
  '106': QUEENS,
  '107': QUEENS,
  '108': QUEENS,
  '109': QUEENS,
  '110': QUEENS,
  '111': QUEENS,
  '112': QUEENS,
  '113': QUEENS,
  '114': QUEENS,
  '115': QUEENS,
  '120': STATEN_ISLAND,
  '121': STATEN_ISLAND,
  '122': STATEN_ISLAND,
  '123': STATEN_ISLAND,
}

const issuingAgencies = {
  AMTRAK_POLICE: 'Amtrak Police',
  DEPARTMENT_OF_HOMELAND_SECURITY: 'Department of Homeland Security (DHS)',
  METROPOLITAN_TRANSPORTATION_AUTHORITY_POLICE_DEPARTMENT: 'MTA Police',
  NEW_YORK_CITY_DEPARTMENT_OF_CORRECTIONS: 'NYC Department of Corrections (NYC DOC)',
  NEW_YORK_CITY_DEPARTMENT_OF_SANITATION: 'Department of Sanitation (DSNY)',
  NEW_YORK_CITY_DEPARTMENT_OF_HEALTH_POLICE: 'NYC Department of Health Police (NYC DOHMH)',
  NEW_YORK_CITY_DEPARTMENT_OF_PARKS_AND_RECREATION: 'NYC Parks',
  NEW_YORK_CITY_DEPARTMENT_OF_TRANSPORTATION: 'NYC Department of Transportation',
  NEW_YORK_CITY_DEPARTMENT_OF_TRANSPORTATION_PARKING_CONTROL_UNIT: 'Deparment of Transportation (NYC DOT) Parking Control Unit',
  NEW_YORK_CITY_FIRE_DEPARTMENT: 'New York Fire Department (FDNY)',
  NEW_YORK_CITY_HEALTH_AND_HOSPITALS_POLICE: 'NYC Health & Hospitals Police (NYC H+H)',
  NEW_YORK_CITY_HOUSING_AUTHORITY_POLICE: 'NYC Housing Authority Police (NYCHA)',
  NEW_YORK_CITY_POLICE_DEPARTMENT: 'New York Police Department (NYPD)',
  NEW_YORK_CITY_POLICE_DEPARTMENT_TRAFFIC_ENFORCEMENT: 'NYPD Traffic Enforcement',
  NEW_YORK_CITY_SHERIFF: 'New York City Sheriff',
  NEW_YORK_CITY_TAXI_AND_LIMOUSINE_COMMISSION: 'NYC Taxi & Limousine Commission Police (TLC)',
  NEW_YORK_STATE_COURT_OFFICERS: 'New York State Court Officers',
  NEW_YORK_STATE_OFFICE_FOR_PEOPLE_WITH_DEVELOPMENTAL_DISABILITIES: 'New York State Office for People With Developmental Disabilities',
  NEW_YORK_STATE_OFFICE_OF_MENTAL_HEALTH_POLICE: 'New York State Office Of Mental Health Police',
  NEW_YORK_STATE_PARKS_POLICE: 'New York State Parks Police',
  PORT_AUTHORITY_POLICE_DEPARTMENT: 'Port Authority Police (PANYNJ)',
  ROOSEVELT_ISLAND_PUBLIC_SAFETY: 'Roosevelt Island Security (RIOC)',
  SEA_GATE_POLICE_DEPARTMENT: 'Sea Gate Police Department',
  SNUG_HARBOR_CULTURAL_CENTER_RANGERS: 'Snug Harbor Cultural Center Rangers',
  TRIBOROUGH_BRIDGE_AND_TUNNEL_AUTHORITY_POLICE: 'Triborough Bridge & Tunnel Authority Police (TBTA)',
  UNKNOWN_ISSUER: 'Unknown Issuer',
}

const vehicleBodyTypes = {
  BOAT: 'Boat',
  BUS: 'Bus',
  COMMERCIAL_VEHICLE: 'Commercial Vehicle',
  CONVERTIBLE: 'Convertible',
  DUMP_TRUCK: 'Dump Truck',
  FLATBED_TRUCK: 'Flatbed Truck',
  HATCHBACK: 'Hatchback',
  HEARSE: 'Hearse',
  LIMOUSINE: 'Limousine',
  MOPED: 'Moped',
  MOTORCYCLE: 'Motorcycle',
  PICKUP_TRUCK: 'Pickup Truck',
  REFRIGERATION_TRUCK: 'Refrigeration Truck',
  RV: 'RV',
  SEDAN: 'Sedan',
  SEMI_TRAILER: 'Semi Trailer',
  SNOWMOBILE: 'Snowmobile',
  STAKE_TRUCK: 'Stake Truck',
  STATION_WAGON: 'Station Wagon',
  SUV: 'SUV',
  TANK_TRUCK: 'Tank Truck',
  TAXI: 'Taxi',
  TOW_TRUCK: 'Tow Truck',
  TRACTION_ENGINE: 'Traction Engine',
  TRACTOR: 'Tractor',
  TRACTOR_CRANE: 'Tractor Crane',
  TRAILER: 'Trailer',
  TRUCK: 'Truck',
  TRUCK_CRANE: 'Truck Crane',
  UNKNOWN_BODY_TYPE: 'Unknown Body Type',
  UTILITY_VEHICLE: 'Utility Vehicle',
  VAN: 'Van',
}

const violationStatuses = {
  ADMINISTRATIVE_CLAIM_DENIED: 'Administrative Claim Denied',
  ADMINISTRATIVE_CLAIM_GRANTED: 'Administrative Claim Granted',
  ADMINISTRATIVE_REDUCTION: 'Administrative Fines Reduction',
  APPEAL_ABANDONED: 'Appeal Abandoned',
  APPEAL_AFFIRMED: 'Appeal Affirmed',
  APPEAL_MODIFIED: 'Appeal Modified',
  APPEAL_REMANDED: 'Appeal Remanded',
  APPEAL_REVERSED: 'Appeal Reversed',
  HEARING_ADJOURNED: 'Hearing Adjourned',
  HEARING_HELD_GUILTY: 'Hearing Held - Guilty',
  HEARING_HELD_GUILTY_REDUCTION: 'Hearing Held - Guilty, Fines Reduced',
  HEARING_HELD_NOT_GUILTY: 'Hearing Held - Not Guilty',
  HEARING_HELD_FINES_REINSTATED: 'Hearing Held - Fines Reinstated',
  HEARING_PENDING: 'Hearing Pending',
  HEARING_WAIVED: 'Hearing Waived',
  UNKNOWN: 'Unknown Violation Status',
}

class CameraStreakData {
  constructor(maxStreak, streakStart, streakEnd) {
    this.max_streak = maxStreak
    this.streak_end = streakEnd
    this.streak_start = streakStart
  }
}

class CameraData {
  constructor(
    busLaneCameraStreakData,
    mixedCameraStreakData,
    mixedCameraWithBusLaneCameraStreakData,
    redLightCameraStreakData,
    speedCameraStreakData
  ) {
    this.bus_lane_camera_violations = busLaneCameraStreakData
    this.camera_violations = mixedCameraStreakData
    this.camera_violations_with_bus_lane_camera_violations =
      mixedCameraWithBusLaneCameraStreakData
    this.red_light_camera_violations = redLightCameraStreakData
    this.school_zone_speed_camera_violations = speedCameraStreakData
  }
}

class FineData {
  constructor(
    totalFined,
    totalInJudgment,
    totalOutstanding,
    totalPaid,
    totalReduced
  ) {
    this.total_fined = totalFined
    this.total_outstanding = totalOutstanding
    this.total_paid = totalPaid
    this.total_reduced = totalReduced
    this.total_in_judgment = totalInJudgment
  }

  get areFinesAssessed() {
    return this.total_fined > 0
  }

  get maxAmount() {
    return Math.max(
      this.total_fined,
      this.total_outstanding,
      this.total_paid,
      this.total_reduced
    )
  }
}

/**
 * Creates a new PlateLookup with number of violations and the date it was created.
 * @class
 * @classdesc Encapsulates data from a previous lookup of the same plate.
 */
class PlateLookup {
  constructor(createdAt, numViolations) {
    this.createdAt = createdAt
    this.numViolations = numViolations
  }
}

const initializeConnection = (config) => {
  const addDisconnectHandler = (connection) => {
    connection.on("error", (error) => {
      if (error instanceof Error) {
        if (error.code === "PROTOCOL_CONNECTION_LOST") {
          console.error(error.stack)
          console.log("Lost connection. Reconnecting...")

          initializeConnection(connection.config)
        } else if (error.fatal) {
          throw error
        }
      }
    })
  }

  const connection = mysql.createConnection(config)

  connection.promiseQuery = (sql, values) => {
    return new Promise((resolve, reject) => {
      return connection.query(sql, values, (error, results, fields) => {
        if (error) reject(error)
        if (results) resolve(results)
      })
    })
  }

  // Add handlers.
  addDisconnectHandler(connection)

  connection.connect()
  return connection
}

/**
 *
 * @param {string} inputLocation - mostly normalized address
 * @returns an address normalized for specific nasty locations
 *
 * Some address data is so hairy that it requires specific fixes.
 * Let's apply them.
 */
const applyStreetSpecificLocationFixes = (inputLocation) => {
  let standardizedLocation = inputLocation

  standardizedLocation = standardizedLocation.replace(/Crossbay/, 'Cross Bay')
  standardizedLocation = standardizedLocation.replace(
    /193rd Street-/,
    'between 193rd Street and',
  )
  standardizedLocation = standardizedLocation.replace(
    /Fultonmall/,
    'Fulton Mall',
  )
  standardizedLocation = standardizedLocation.replace(/Mcdonald/, 'McDonald')
  standardizedLocation = standardizedLocation.replace(
    /Selfridge Street Ns Nansen Street 75' Wo/,
    'North side of Nansen Street 75 feet west of Selfridge Street',
  )
  standardizedLocation = standardizedLocation.replace(
    /West of South 3rd Hewes Street/,
    'Hewes Street west of South 3rd Street',
  )
  standardizedLocation = standardizedLocation.replace(/Fdr\s/, 'FDR ')
  standardizedLocation = standardizedLocation.replace(
    /Riverband S\/p Police Parking/,
    'Riverbank State Park',
  )
  standardizedLocation = standardizedLocation.replace(
    /1045 St Nich/,
    '1045 Saint Nicholas Avenue',
  )
  standardizedLocation = standardizedLocation.replace(
    /E 107 E 125 St/,
    '107 East 125th Street',
  )
  standardizedLocation = standardizedLocation.replace(
    /150 Haven/,
    '150 Haven Avenue',
  )
  standardizedLocation = standardizedLocation.replace(
    /E Tremont Ave @ St Lawrence Ave/,
    'East Tremont Avenue and Saint Lawrence Avenue',
  )

  return standardizedLocation
}

const createNewLookup = async (
  plate,
  state,
  plateTypes,
  numViolations,
  lookupSource,
  uniqueIdentifier,
  cameraStreakData,
  fingerprintID,
  mixpanelID
) => {
  const countTowardsFrequency = !["api"].includes(lookupSource)

  const bootEligibleUnderRdaaThreshold =
    cameraStreakData?.camera_violations?.max_streak >=
      CAMERA_THRESHOLDS.camera_violations || false
  const bootEligibleUnderDvaaThreshold =
    cameraStreakData?.red_light_camera_violations?.max_streak >=
      CAMERA_THRESHOLDS.red_light_camera_violations ||
    cameraStreakData?.school_zone_speed_camera_violations?.max_streak >=
      CAMERA_THRESHOLDS.school_zone_speed_camera_violations ||
    false

  const newLookup = {
    boot_eligible_under_rdaa_threshold: bootEligibleUnderRdaaThreshold,
    boot_eligible_under_dvaa_threshold: bootEligibleUnderDvaaThreshold,
    bus_lane_camera_violations:
      cameraStreakData?.bus_lane_camera_violations?.total || 0,
    count_towards_frequency: !!countTowardsFrequency,
    created_at: new Date(),
    external_username: null,
    fingerprint_id: fingerprintID,
    lookup_source: lookupSource,
    message_id: null,
    mixpanel_id: mixpanelID,
    num_tickets: numViolations,
    observed: null,
    plate,
    plate_types: plateTypes ? plateTypes.join() : null,
    responded_to: true,
    red_light_camera_violations:
      cameraStreakData?.red_light_camera_violations?.total || 0,
    speed_camera_violations:
      cameraStreakData?.school_zone_speed_camera_violations?.total || 0,
    state,
    unique_identifier: uniqueIdentifier,
  }

  insertNewLookup(newLookup, (error, results, fields) => {
    if (error) {
      console.log(`error thrown at: ${new Date()}`)
      throw error
    }
  })
}

/**
 * Creates a string summarizing a vehicle's previous lookup details
 *
 * @param {number}      numNewViolations - Frequency of violations for each borough
 * @param {string}      plate            - The text on this license plate
 * @param {string}      state            - The two-character abbreviation of the plate's state
 * @param {string}     plateTypes        - The possible type(s) of this plate
 * @param {PlateLookup} previousLookup   - Number of violations and creation date of a previous lookup
 */
const createRepeatLookupString = (
  numNewViolations,
  plate,
  state,
  plateTypes,
  previousLookup = undefined
) => {
  let violationsString = ""

  if (previousLookup && numNewViolations > 0) {
    // Determine when the last lookup was...
    const previousLookupDateTime = previousLookup.createdAt
    const previousLookupDateTimeInUTC = DateTime.fromJSDate(
      previousLookupDateTime
    ).toUTC()
    const nowInUTC = DateTime.utc()

    // If at least five minutes have passed...
    if (nowInUTC.minus({ minutes: 5 }) > previousLookupDateTimeInUTC) {
      // Add the new ticket info and previous lookup time to the string.

      const previousLookupTimeInUTCString =
        previousLookupDateTimeInUTC.toFormat("hh:mm:ss a ZZZZ")
      const previousLookupDateInUTCString =
        previousLookupDateTimeInUTC.toFormat("LLLL dd, y")

      const lastQueriedString = `This vehicle was last queried on ${previousLookupDateInUTCString} at ${previousLookupTimeInUTCString}.`
      violationsString += lastQueriedString

      const plateHashTagString = getPlateHashTagString(plate, state)
      const plateTypesString = plateTypes ? ` (types: ${plateTypes}) ` : " "
      const fullPlateString = plateHashTagString + plateTypesString

      const newTicketsSinceString = ` Since then, ${fullPlateString}has received ${numNewViolations} new ticket${
        numNewViolations === 1 ? "" : "s"
      }.\n\n`

      violationsString += newTicketsSinceString
    }
  }

  return violationsString
}

const detectPlateTypes = (potentialPlateTypeString) => {
  if (potentialPlateTypeString.indexOf(",") !== -1) {
    // If the potential plate type string has a comma, split it on the comma
    const parts = potentialPlateTypeString.split(",")
    const bools = parts.map((part) => !!part.match(registrationTypesRegex))
    return bools.some(Boolean)
  } else {
    return !!potentialPlateTypeString.match(registrationTypesRegex)
  }
}

const detectState = (potentialStateString) => {
  return !!potentialStateString.match(stateAbbrRegex)
}

const detectVehicles = (potentialVehicles) => {
  return potentialVehicles.map((plate) => {
    const vehicle = { original_string: plate }

    const parts = plate.toUpperCase().trim().split(":")

    if ([2, 3].includes(parts.length)) {
      const stateBools = parts.map((part) => detectState(part))
      const stateIndex = stateBools.indexOf(true)

      const plateTypesBools = parts.map((part) => detectPlateTypes(part))
      const plateTypesIndex = plateTypesBools.indexOf(true)

      const haveValidPlate =
        (parts.length === 2 && stateIndex !== -1) ||
        (parts.length === 3 && ![plateTypesIndex, stateIndex].includes(-1))

      if (haveValidPlate) {
        const plateIndex = [...Array(parts.length).keys()].filter(
          (part) => ![stateIndex, plateTypesIndex].includes(part)
        )[0]

        vehicle.state = parts[stateIndex]
        vehicle.types = parts[plateTypesIndex]
        vehicle.plate = parts[plateIndex]
        vehicle.valid_plate = true
      } else {
        vehicle.valid_plate = false
      }
    } else {
      vehicle.valid_plate = false
    }

    return vehicle
  })
}

/**
 * NYC Department of Finance (DOF) reuses violation codes over the years.
 * Using the cutover dates for several of these violation code changes
 * (inferred by some detective work), we can determine what the correct
 * description was at the time this violation was issued.
 * @param {string} violationCode
 * @param {string | undefined} violationIssueDate
 * @returns {string | null}
 */
const determineViolationFromViolationCodeAndDate = (
  violationCode,
  violationIssueDate
) => {
  if (!(violationCode in fiscalYearReadableViolationDescriptions)) {
    // If we don't know about this violation code, just return null.
    return null
  }

  const violationDescriptionDefinition = fiscalYearReadableViolationDescriptions[
    violationCode
  ]
  if (
    typeof violationDescriptionDefinition === "object" &&
    violationIssueDate
  ) {
    let fiscalYearReadableDescription

    // Some violation codes have applied to multiple violations.
    violationDescriptionDefinition.forEach((possibleDescription) => {
      if (
        Date.parse(possibleDescription.startDate) <=
        Date.parse(violationIssueDate)
      ) {
        fiscalYearReadableDescription = possibleDescription.description
      }
    })

    return fiscalYearReadableDescription
  } else {
    return violationDescriptionDefinition
  }
}

/**
 * NYC Department of Finance (DOF) reuses violation codes over the years.
 * Using the cutover dates for several of these violation code changes
 * (inferred by some detective work), we can determine what the correct
 * description was at the time this violation was issued.
 * @param {string | Object} violationDescriptionDefinition
 * @param {string | undefined} violationIssueDate
 * @returns {string}
 */
const determineViolationFromViolationDescriptionAndDate = (
  violationDescriptionDefinition,
  violationIssueDate
) => {
  if (
    typeof violationDescriptionDefinition === "object" &&
    violationIssueDate
  ) {
    let fiscalYearReadableDescription

    // Some violation codes have applied to multiple violations.
    violationDescriptionDefinition.forEach((possibleDescription) => {
      if (
        Date.parse(possibleDescription.startDate) <=
        Date.parse(violationIssueDate)
      ) {
        fiscalYearReadableDescription = possibleDescription.description
      }
    })

    return fiscalYearReadableDescription
  } else {
    return violationDescriptionDefinition
  }
}

const filterOutViolationsAfterSearchDate = (
  violations,
  existingLookupCreatedAt
) =>
  violations.filter(
    (item) => item.formatted_time_eastern <= existingLookupCreatedAt
  )

const findFilterFields = (fieldsString) => {
  const returnFields = {}

  if (!fieldsString) {
    return returnFields
  }

  const fields = fieldsString.replace(/(\([^)]*\))/g, "").split(",")

  fields.forEach((field) => {
    if (fieldsString[fieldsString.indexOf(field) + field.length] === "(") {
      const re = new RegExp(field + "\\([\\w|,]*\\)", "g")

      let subfields = fieldsString.match(re)
        ? fieldsString.match(re)[0].replace(field, "")
        : null
      subfields = subfields.substring(1, subfields.length - 1)

      if (subfields) {
        returnFields[field] = findFilterFields(subfields.replace(/[(|)]/g, ""))
      } else if (subfields === "") {
        returnFields[field] = {}
      }
    } else {
      returnFields[field] = {}
    }
  })

  return returnFields
}

const findMaxCameraViolationsStreak = (violationTimes) => {
  let maxStreak = 0
  let streakEnd = null
  let streakStart = null

  violationTimes.forEach((date) => {
    const yearMinusOneDayLater = date.set({ year: date.year + 1, day: -1 })

    const yearLongTickets = violationTimes.filter(
      (otherDate) => otherDate >= date && otherDate < yearMinusOneDayLater
    )

    const sortedYearLongTickets = yearLongTickets.sort((a, b) => {
      if (a > b) {
        return 1
      }
      if (b > a) {
        return -1
      }
      return 0
    })

    const thisStreak = yearLongTickets.length

    if (thisStreak > maxStreak) {
      maxStreak = thisStreak
      streakEnd = sortedYearLongTickets[yearLongTickets.length - 1]
      streakStart = sortedYearLongTickets[0]
    }
  })

  return new CameraStreakData(maxStreak, streakStart, streakEnd)
}

/**
 * Forms a plate lookup response in multiple tweets.
 *
 * @param {Array<Object<string, number>>} boroughFrequencyData       - Frequency of violations for each borough
 * @param {number}                        frequency                  - The number of times this plate has been queried
 * @param {FineData}                      fineData                   - The individual sums of fines assessed,
 *                                                                     reduced, paid, and outstanding
 * @param {string}                        plate                      - The text on this license plate
 * @param {string}                        plateTypes                 - The possible type(s) of this plate
 * @param {string}                        state                      - The two-character abbreviation of the plate's state
 * @param {string}                        uniqueIdentifier           - 8-digit alphanumeric code that uniquely
 *                                                                     identifies this lookup
 * @param {Array<Object<string, number>>} violationTypeFrequencyData - Frequency of individual violation types
 * @param {Array<Object<string, number>>} yearFrequencyData          - Frequency of total violations in individual years
 * @param {CameraData}                    cameraStreakData           - Totals and streak starts and ends for all
 *                                                                     camera violations, including combinations
 * @param {PlateLookup}                   previousLookup            - Number of violations and creation date of
 *                                                                     a previous lookup
 */
const formPlateLookupTweets = (
  boroughFrequencyData,
  frequency,
  fineData,
  plate,
  state,
  plateTypes,
  uniqueIdentifier,
  violationTypeFrequencyData,
  yearFrequencyData,
  cameraStreakData = undefined,
  existingLookupCreatedAt = undefined,
  previousLookup = undefined
) => {
  // response_chunks holds tweet-length-sized parts of the response
  // to be tweeted out or appended into a single direct message.

  const responseChunks = []
  let violationsString = ""

  // Get total violations
  const totalViolations = Object.values(violationTypeFrequencyData).reduce(
    (prev, next) => prev + next,
    0
  )

  const asOfDateTime = existingLookupCreatedAt
    ? DateTime.fromJSDate(existingLookupCreatedAt)
    : DateTime.utc()

  const asOfDateTimeInEasternTime = asOfDateTime.setZone('America/New_York')
  const asOfTime = asOfDateTimeInEasternTime.toFormat('hh:mm:ss a ZZZZ')
  const asOfDate = asOfDateTimeInEasternTime.toFormat('LLLL dd, y')
  const timePrefix = `As of ${asOfTime} on ${asOfDate}:`


  // Append time prefix to blank string to start to build tweet.
  violationsString += timePrefix

  // Append summary string.
  const plateHashTagString = getPlateHashTagString(plate, state)
  const plateTypesString = plateTypes ? ` (types: ${plateTypes}) ` : " "
  const lookupSummaryString = ` ${plateHashTagString}${plateTypesString}has been queried ${frequency} time${
    frequency === 1 ? "" : "s"
  }.\n\n`

  violationsString += lookupSummaryString

  // If this vehicle has been queried before...
  if (previousLookup) {
    const previousNumViolations = previousLookup.numViolations
    const numNewViolations = totalViolations - previousNumViolations

    violationsString += createRepeatLookupString(
      numNewViolations,
      plate,
      state,
      plateTypes,
      previousLookup
    )
  }

  responseChunks.push(violationsString)

  const totalViolationsPrefixFormatString = `Total parking and camera violation tickets for ${plateHashTagString}: ${totalViolations}:\n\n`
  const totalViolationsContinuedFormatString = `Total parking and camera violation tickets for ${plateHashTagString}, cont'd:\n\n`

  responseChunks.push(
    handleResponsePartFormation(
      violationTypeFrequencyData,
      totalViolationsPrefixFormatString,
      totalViolationsContinuedFormatString,
      "No Violation Description Available"
    )
  )

  if (Object.keys(yearFrequencyData).length) {
    const yearPrefixFormatString = `Violations by year for ${plateHashTagString}\n\n`
    const yearContinuedFormatString = `Violations by year for ${plateHashTagString}, cont'd:\n\n`

    responseChunks.push(
      handleResponsePartFormation(
        yearFrequencyData,
        yearPrefixFormatString,
        yearContinuedFormatString,
        "No Year Available"
      )
    )
  }

  if (Object.keys(boroughFrequencyData).length) {
    const boroughPrefixFormatString = `Violations by borough for ${plateHashTagString}:\n\n`
    const boroughContinuedFormatString = `Violations by borough for ${plateHashTagString}, cont'd:\n\n`

    responseChunks.push(
      handleResponsePartFormation(
        boroughFrequencyData,
        boroughPrefixFormatString,
        boroughContinuedFormatString,
        "No Borough Available"
      )
    )
  }

  if (fineData && fineData.areFinesAssessed) {
    let curString = `Known fines for ${plateHashTagString}:\n\n`
    const maxCountLength = US_DOLLAR_FORMAT_OBJECT.format(
      fineData.maxAmount
    ).length

    const spacesNeeded = maxCountLength * 2 + 1

    FINE_FIELDS.forEach((fineType) => {
      const fineTypeAmount = fineData[fineType]
      const currencyString = US_DOLLAR_FORMAT_OBJECT.format(fineTypeAmount)

      const countLength = currencyString.length

      // e.g., if spaces_needed is 5, and count_length is 2, we need
      // to pad to 3.
      const leftJustifyAmount = spacesNeeded - countLength

      const humanReadableFineType = fineType
        .replace("total_", "")
        .replace("_", " ")

      // formulate next string part
      const nextPart = `${currencyString.padEnd(
        leftJustifyAmount
      )}| ${humanReadableFineType.replace(/\b[a-z]/g, (firstLetterOfWord) =>
        firstLetterOfWord.toUpperCase()
      )}\n`

      // determine current string length if necessary
      const potentialResponseLength = (curString + nextPart).length

      // If violation string so far and new part are less or
      // equal than 280 characters, append to existing tweet string.
      if (potentialResponseLength <= MAX_TWITTER_STATUS_LENGTH) {
        curString += nextPart
      } else {
        responseChunks.push(curString)

        curString = `Known fines for ${plateHashTagString}, cont'd:\n\n`
        curString += nextPart
      }
    })

    // add to container
    responseChunks.push(curString)
  }

  if (cameraStreakData) {
    Object.entries(CAMERA_THRESHOLDS).forEach(
      ([thresholdName, thresholdValue]) => {
        if (thresholdName === "camera_violations") {
          return
        }

        const thresholdData = cameraStreakData[thresholdName]
        if (thresholdData) {
          if (thresholdData.max_streak >= thresholdValue) {
            const humanReadableCameraTypeName =
              thresholdName === "red_light_camera_violations"
                ? "red light"
                : thresholdName === "school_zone_speed_camera_violations"
                ? "school zone speed"
                : "unknown camera type"

            const formattedStreakStartDate =
              thresholdData.streak_start.toFormat("LLLL dd, y")
            const formattedStreakEndDate =
              thresholdData.streak_end.toFormat("LLLL dd, y")
            const dvaaString = `Under the Dangerous Vehicle Abatement Act, this vehicle could have been booted or impounded due to its ${thresholdData.max_streak} ${humanReadableCameraTypeName} camera violations (>= ${thresholdValue}/year) from ${formattedStreakStartDate} to ${formattedStreakEndDate}.\n`

            responseChunks.push(dvaaString)
          }
        }
      }
    )
  }

  const uniqueLink = getWebsitePlateLookupLink(uniqueIdentifier)

  const websiteLinkString = `View more details at ${uniqueLink}.`
  responseChunks.push(websiteLinkString)

  return responseChunks
}

const getAggregateFineDataForVehicle = (violations) => {
  let totalFined = 0
  let totalPaid = 0
  let totalReduced = 0
  let totalOutstanding = 0
  let totalInJudgment = 0

  violations.forEach((violation) => {
    totalFined += violation.fined ?? 0
    totalPaid += violation.paid ?? 0
    totalReduced += violation.reduced ?? 0
    totalOutstanding += violation.outstanding ?? 0
    totalInJudgment +=
      violation.judgment_entry_date && violation.outstanding
        ? violation.outstanding
        : 0
  })

  return new FineData(
    totalFined,
    totalInJudgment,
    totalOutstanding,
    totalPaid,
    totalReduced
  )
}

/**
 * Gets stats for a lookup on borough, year, violation type frequency
 *
 * @param {Array<string, any>} violations - all the violations for a vehicle available in open data
 */
const getAggregateFrequencySummaryData = (violations) => {
  const years = {}
  const boroughs = {}
  const violationTypes = {}

  violations.forEach((violation) => {
    const borough = violation.violation_county || "No Borough Available"

    if (boroughs[borough]) {
      boroughs[borough] += 1
    } else {
      boroughs[borough] = 1
    }

    const violationYear =
      violation?.formatted_time_eastern?.toFormat("y") || "No Year Available"

    if (years[violationYear]) {
      years[violationYear] += 1
    } else {
      years[violationYear] = 1
    }

    const humanReadableViolationDescription =
      violation.humanized_description || "No Violation Description Available"

    if (violationTypes[humanReadableViolationDescription]) {
      violationTypes[humanReadableViolationDescription] += 1
    } else {
      violationTypes[humanReadableViolationDescription] = 1
    }
  })

  return {
    boroughs,
    violation_types: violationTypes,
    years,
  }
}

const getCameraStreakData = (violations) => {
  const busLaneCameraViolations = violations.filter(
    (violation) =>
      violation.humanized_description === BUS_LANE_VIOLATION ||
      violation.humanized_description === MOBILE_BUS_LANE_VIOLATION
  )
  const cameraViolations = violations.filter(
    (violation) =>
      violation.humanized_description === SCHOOL_ZONE_SPEED_CAMERA_VIOLATION ||
      violation.humanized_description === FAILURE_TO_STOP_AT_RED_LIGHT
  )
  const cameraViolationsWithBusCameraViolations = violations.filter(
    (violation) =>
      [
        BUS_LANE_VIOLATION,
        FAILURE_TO_STOP_AT_RED_LIGHT,
        MOBILE_BUS_LANE_VIOLATION,
        SCHOOL_ZONE_SPEED_CAMERA_VIOLATION,
      ].includes(violation.humanized_description)
  )
  const redLightCameraViolations = violations.filter(
    (violation) =>
      violation.humanized_description === FAILURE_TO_STOP_AT_RED_LIGHT
  )
  const speedCameraViolations = violations.filter(
    (violation) =>
      violation.humanized_description === SCHOOL_ZONE_SPEED_CAMERA_VIOLATION
  )

  const busLaneCameraStreakData = {
    ...findMaxCameraViolationsStreak(
      busLaneCameraViolations.map(
        (violation) => violation.formatted_time_eastern
      )
    ),
    total: busLaneCameraViolations.length,
  }
  const mixedCameraStreakData = {
    ...findMaxCameraViolationsStreak(
      cameraViolations.map((violation) => violation.formatted_time_eastern)
    ),
    total: cameraViolations.length,
  }
  const mixedCameraWithBusLaneCameraStreakData = {
    ...findMaxCameraViolationsStreak(
      cameraViolationsWithBusCameraViolations.map(
        (violation) => violation.formatted_time_eastern
      )
    ),
    total: cameraViolationsWithBusCameraViolations.length,
  }
  const redLightCameraStreakData = {
    ...findMaxCameraViolationsStreak(
      redLightCameraViolations.map(
        (violation) => violation.formatted_time_eastern
      )
    ),
    total: redLightCameraViolations.length,
  }
  const speedCameraStreakData = {
    ...findMaxCameraViolationsStreak(
      speedCameraViolations.map((violation) => violation.formatted_time_eastern)
    ),
    total: speedCameraViolations.length,
  }

  return new CameraData(
    busLaneCameraStreakData,
    mixedCameraStreakData,
    mixedCameraWithBusLaneCameraStreakData,
    redLightCameraStreakData,
    speedCameraStreakData
  )
}

/**
 * Return the key with the most violations in a collection
 *
 * @param {Object<string, any>} collection - an object with any keys, where the values are always
 *                                           a number of violations pertaining to that key
 */
const getCollectionKeyWithMostViolations = (collection) => {
  const objectEntries = Object.entries(collection)
  let keyWithMostViolations
  let violationsMax = 0

  objectEntries.forEach(([key, violationCountForKey]) => {
    if (violationCountForKey > violationsMax) {
      violationsMax = violationCountForKey
      keyWithMostViolations = key
    }
  })

  return keyWithMostViolations
}

/**
 * Get the agency that issued this violation from the code or name on the violation
 */
const getIssuingAgency = (agencyish) => {
  if (!agencyish) {
    return issuingAgencies['UNKNOWN_ISSUER']
  }

  switch (agencyish) {
    case 'AMTRAK RAILROAD POLICE':
    case 'J':
      return issuingAgencies['AMTRAK_POLICE']

    case 'D':
    case 'DEPARTMENT OF BUSINESS SERVICES':
    case 'DEPARTMENT OF CORRECTION':
    case 'I':
    case 'Q':
    case 'STATEN ISLAND RAPID TRANSIT POLICE':
      return issuingAgencies['NEW_YORK_CITY_DEPARTMENT_OF_CORRECTIONS']

    case 'DEPARTMENT OF SANITATION':
    case 'S':
      return issuingAgencies['NEW_YORK_CITY_DEPARTMENT_OF_SANITATION']

    case 'DEPARTMENT OF TRANSPORTATION':
    case 'U':
    case 'V':
      return issuingAgencies['NEW_YORK_CITY_DEPARTMENT_OF_TRANSPORTATION']

    case '7':
    case 'SUNY MARITIME COLLEGE':
    case 'HEALTH AND HOSPITAL CORP. POLICE':
    case 'Y':
      return issuingAgencies['NEW_YORK_CITY_HEALTH_AND_HOSPITALS_POLICE']

    case 'H':
    case 'HOUSING AUTHORITY':
      return issuingAgencies['NEW_YORK_CITY_HOUSING_AUTHORITY_POLICE']

    case 'F':
    case 'FIRE DEPARTMENT':
      return issuingAgencies['NEW_YORK_CITY_FIRE_DEPARTMENT']

    case 'HEALTH DEPARTMENT POLICE':
    case 'W':
      return issuingAgencies['NEW_YORK_CITY_DEPARTMENT_OF_HEALTH_POLICE']

    case 'METRO NORTH RAILROAD POLICE':
    case 'Z':
      return issuingAgencies['DEPARTMENT_OF_HOMELAND_SECURITY']

    case '9':
    case 'NYC OFFICE OF THE SHERIFF':
      return issuingAgencies['NEW_YORK_CITY_SHERIFF']

    case 'O':
    case 'NYS COURT OFFICERS':
      return issuingAgencies['NEW_YORK_STATE_COURT_OFFICERS']

    case '1':
    case 'NYS OFFICE OF MENTAL HEALTH POLICE':
      return issuingAgencies['NEW_YORK_STATE_OFFICE_OF_MENTAL_HEALTH_POLICE']

    case 'N':
    case 'NYS PARKS POLICE':
      return issuingAgencies['NEW_YORK_STATE_PARKS_POLICE']

    case '2':
    case 'O M R D D':
      return issuingAgencies['NEW_YORK_STATE_OFFICE_FOR_PEOPLE_WITH_DEVELOPMENTAL_DISABILITIES']

    case 'PARKING CONTROL UNIT':
      return issuingAgencies['NEW_YORK_CITY_DEPARTMENT_OF_TRANSPORTATION_PARKING_CONTROL_UNIT']

    case 'K':
    case 'PARKS DEPARTMENT':
      return issuingAgencies['NEW_YORK_CITY_DEPARTMENT_OF_PARKS_AND_RECREATION']

    case 'P':
    case 'POLICE DEPARTMENT':
      return issuingAgencies['NEW_YORK_CITY_POLICE_DEPARTMENT']

    case 'A':
    case 'PORT AUTHORITY':
      return issuingAgencies['PORT_AUTHORITY_POLICE_DEPARTMENT']

    case '3':
    case 'NYC TRANSIT AUTHORITY MANAGERS':
    case 'ROOSEVELT ISLAND SECURITY':
      return issuingAgencies['ROOSEVELT_ISLAND_PUBLIC_SAFETY']

    case '4':
    case 'SEA GATE ASSOCIATION POLICE':
      return issuingAgencies['SEA_GATE_POLICE_DEPARTMENT']

    case '5':
    case 'SNUG HARBOR CULTURAL CENTER RANGERS':
      return issuingAgencies['SNUG_HARBOR_CULTURAL_CENTER_RANGERS']

    case 'G':
    case 'TAXI AND LIMOUSINE COMMISSION':
      return issuingAgencies['NEW_YORK_CITY_TAXI_AND_LIMOUSINE_COMMISSION']

    case 'T':
    case 'TRAFFIC':
      return issuingAgencies['NEW_YORK_CITY_POLICE_DEPARTMENT_TRAFFIC_ENFORCEMENT']

    case 'M':
    case 'R':
    case 'TRANSIT AUTHORITY':
      return issuingAgencies['METROPOLITAN_TRANSPORTATION_AUTHORITY_POLICE_DEPARTMENT']

    case 'B':
    case 'TRIBOROUGH BRIDGE AND TUNNEL POLICE':
      return issuingAgencies['TRIBOROUGH_BRIDGE_AND_TUNNEL_AUTHORITY_POLICE']

    case '6':
    case 'BOARD OF ESTIMATE':
    case 'C':
    case 'CON RAIL':
    case 'E':
    case 'L':
    case 'LONG ISLAND RAILROAD':
    case 'X':
    default:
      return issuingAgencies['UNKNOWN_ISSUER']
  }
}

/**
 * Gets stats for a lookup on borough, year, violation type frequency
 *
 * @param {string}      plate            - The text on this license plate
 * @param {string}      state            - The two-character abbreviation of the plate's state
 */
const getPlateHashTagString = (plate, state) => {
  return `#${state.toUpperCase()}_${plate.toUpperCase()}`
}

const getPreviousQueryResult = async (identifier) => {
  return new Promise((resolve, reject) => {
    connection.query(
      "select plate, state, plate_types, created_at from plate_lookups where unique_identifier = ?",
      [identifier],
      (error, results, fields) => {
        if (error) {
          console.log(`error thrown at: ${new Date()}`)
          throw error
        }
        return resolve(results[0])
      }
    )
  })
}

const getReadableViolationDescription = (violation) => {
  const fiscalYearViolationDescriptionKey =
    violation.violation_code || violation.violation_description

  if (fiscalYearViolationDescriptionKey) {
    const violationDescriptionDefinition =
      fiscalYearReadableViolationDescriptions[fiscalYearViolationDescriptionKey]

    if (violationDescriptionDefinition) {
      if (violationDescriptionDefinition) {
        return determineViolationFromViolationDescriptionAndDate(
          violationDescriptionDefinition,
          violation.issue_date,
        )
      }
    }
  }

  const openParkingAndCameraViolationsReadableDescription =
    openParkingAndCameraViolationsReadableViolationDescriptions[
      violation.violation
    ]

  if (openParkingAndCameraViolationsReadableDescription) {
    const inferredViolationCode = inferViolationCodeFromOpenParkingAndCameraViolationDescription(
      openParkingAndCameraViolationsReadableDescription
    )
    const inferredViolationDescription = determineViolationFromViolationCodeAndDate(
      inferredViolationCode,
      violation.issue_date,
    )

    if (inferredViolationDescription) {
      return inferredViolationDescription
    }

    return openParkingAndCameraViolationsReadableDescription
  }

  return null
}

const getSearchQueryStringAndArgs = (
  plate,
  state,
  plateTypes,
  lookupSource,
  existingIdentifier,
  existingLookupCreatedAt
) => {
  let baseFrequencyQueryString =
    "select count(*) as frequency from plate_lookups where plate = ? and state = ? and count_towards_frequency = 1"
  let baseNumTicketsQueryString =
    "select num_tickets, created_at from plate_lookups where plate = ? and state = ? and count_towards_frequency = 1"

  let baseFrequencyQueryArgs = [plate, state]
  let baseNumTicketsQueryArgs = [plate, state]

  if (plateTypes) {
    baseFrequencyQueryString += " and plate_types = ?"
    baseFrequencyQueryArgs = [...baseFrequencyQueryArgs, plateTypes.join()]

    baseNumTicketsQueryString += " and plate_types = ?"
    baseNumTicketsQueryArgs = [...baseNumTicketsQueryArgs, plateTypes.join()]
  } else {
    baseFrequencyQueryString += " and plate_types is null"
    baseNumTicketsQueryString += " and plate_types is null"
  }

  if (lookupSource === EXISTING_LOOKUP_SOURCE) {
    baseFrequencyQueryString += " and created_at <= ?"
    baseFrequencyQueryArgs = [
      ...baseFrequencyQueryArgs,
      existingLookupCreatedAt,
    ]

    baseNumTicketsQueryString +=
      " and unique_identifier <> ? and created_at < ?"
    baseNumTicketsQueryArgs = [
      ...baseNumTicketsQueryArgs,
      existingIdentifier,
      existingLookupCreatedAt,
    ]
  }

  baseNumTicketsQueryString += " ORDER BY created_at DESC LIMIT 1"

  const searchQueryArgs = [
    ...baseFrequencyQueryArgs,
    ...baseNumTicketsQueryArgs,
  ]
  const searchQueryString = `${baseFrequencyQueryString}; ${baseNumTicketsQueryString};`

  return {
    query_args: searchQueryArgs,
    query_string: searchQueryString,
  }
}

const getVehicleResponse = async (vehicle, selectedFields, externalData) => {
  const plate = vehicle.plate
  const state = vehicle.state
  const plateTypes = vehicle.types
    ? vehicle.types.split(",").map((part) => part.trim())
    : null

  const lookupSource = externalData.lookup_source || "api"
  const fingerprintID = externalData.fingerprint_id
  const mixpanelID = externalData.mixpanel_id
  const existingIdentifier = externalData.unique_identifier
  const existingLookupCreatedAt = externalData.existing_lookup_created_at

  if (plate && state) {
    let flattenedResponses = []
    let rectifiedPlate = plate

    const allOpenDataResponses = await Promise.all([
      makeOpenDataVehicleRequests(
        plate,
        state,
        plateTypes
      ),
      makeOpenDataMetadataRequest()
    ])

    const [vehicleDataResponses, metadataResponses] = allOpenDataResponses

    if (vehicleDataResponses.some((endpointResponse) => !endpointResponse)) {
      return Promise.resolve({
        vehicle: {},
        error_string:
          "Sorry, there was an error querying open data for " +
          vehicle.original_string,
        successful_lookup: false,
      })
    }

    const metadataUpdatedAtValues = metadataResponses.reduce((reducedObject, response) => {
      if (!response.config.url) {
        throw Error('Missing response url')
      }
      const { dataUpdatedAt, dataUri } = response.data
      const databasePathname = `${dataUri}.json`
      reducedObject[databasePathname] = DateTime.fromISO(
        dataUpdatedAt, { zone: 'UTC' }
      ).toISO()

      return reducedObject
    }, {})

    const normalizedResponses = vehicleDataResponses.map((response) => {
      const requestUrlObject = new URL(response.config.url)
      const databasePathname = `${requestUrlObject.origin}${requestUrlObject.pathname}`
      const dataUpdatedAt = metadataUpdatedAtValues[databasePathname]
      return normalizeViolations(requestUrlObject.pathname, response.data, dataUpdatedAt)
    })

    await Promise.all(normalizedResponses).then((normalizedResponses) => {
      normalizedResponses.forEach((normalizedResponse) => {
        const filteredNormalizedResponse = normalizedResponse.filter((violation) => !!violation)

        flattenedResponses = [
          ...flattenedResponses,
          ...filteredNormalizedResponse,
        ]
      })
    })

    let violations = mergeDuplicateViolationRecords(flattenedResponses)
    violations = modifyViolationsForResponse(violations)

    if (existingLookupCreatedAt) {
      violations = filterOutViolationsAfterSearchDate(
        violations,
        existingLookupCreatedAt
      )
    }

    // If the plate was modified, let's get what it was modified to.
    if (violations.length) {
      rectifiedPlate = violations[0].plate_id
    }

    const fineData = getAggregateFineDataForVehicle(violations)

    const cameraStreakData = getCameraStreakData(violations)

    const searchQueryData = getSearchQueryStringAndArgs(
      plate,
      state,
      plateTypes,
      lookupSource,
      existingIdentifier,
      existingLookupCreatedAt
    )

    const summaryData = getAggregateFrequencySummaryData(violations)

    return await new Promise((resolve, reject) => {
      queryDatabaseForLookups(
        searchQueryData.query_string,
        searchQueryData.query_args,
        async (error, results, fields) => {
          if (error) {
            console.log(`error thrown at: ${new Date()}`)
            throw error
          }

          const countTowardsFrequency = !["api", "existing_lookup"].includes(lookupSource)
          let frequency = countTowardsFrequency ? 1 : 0
          let previousCount = null
          let previousDate = null
          let previousLookup = null

          const frequencyResult = results?.[0]?.[0]
          const previousLookupResult = results?.[1]?.[0]

          frequency = frequencyResult.frequency + frequency

          if (previousLookupResult) {
            previousCount = previousLookupResult.num_tickets
            previousDate = previousLookupResult.created_at

            previousLookup = new PlateLookup(previousDate, previousCount)
          }

          const uniqueIdentifier =
            existingIdentifier || (await obtainUniqueIdentifier())

          if (lookupSource !== EXISTING_LOOKUP_SOURCE) {
            createNewLookup(
              plate,
              state,
              plateTypes,
              violations.length,
              lookupSource,
              uniqueIdentifier,
              cameraStreakData,
              fingerprintID,
              mixpanelID
            )
          }

          const tweetParts = formPlateLookupTweets(
            summaryData.boroughs,
            frequency,
            fineData,
            plate,
            state,
            plateTypes,
            uniqueIdentifier,
            summaryData.violation_types,
            summaryData.years,
            cameraStreakData,
            existingLookupCreatedAt,
            previousLookup
          )

          const fullVehicleLookup = {
            camera_streak_data: cameraStreakData,
            fines: fineData,
            plate,
            plate_types: plateTypes,
            previous_lookup_date: previousDate,
            previous_violation_count: previousCount,
            rectified_plate: rectifiedPlate,
            statistics: summaryData,
            state,
            times_queried: frequency,
            tweet_parts: tweetParts.flat(),
            unique_identifier: uniqueIdentifier,
            violations,
            violations_count: violations.length,
          }

          const returnObject = {
            successful_lookup: true,
            vehicle: stripReturnData(fullVehicleLookup, selectedFields),
          }

          resolve(returnObject)
        }
      )
    })
  } else {
    return {
      vehicle: {},
      error_string:
        "Sorry, a plate and state could not be inferred from " +
        vehicle.original_string,
      successful_lookup: false,
    }
  }
}

/**
 * Cleans up the terrible quality of vehicle body type data
 * available in the open data.
 *
 * @param {*} bodyTypeish - the unsanitized body type of the vehicle
 * @returns string - the sanitized body type of the vehicle
 */
const getVehicleBodyType = (bodyTypeish) => {
  if (!bodyTypeish) {
    return undefined
  }

  switch (bodyTypeish) {
    case 'BOAT':
      return vehicleBodyTypes['BOAT']

    case 'BU':
    case 'BUS':
      return vehicleBodyTypes['BUS']

    case 'CV':
      return vehicleBodyTypes['COMMERCIAL_VEHICLE']

    case 'CON':
    case 'CONV':
      return vehicleBodyTypes['CONVERTIBLE']

    case 'DUMP':
      return vehicleBodyTypes['DUMP_TRUCK']

    case 'FLAT':
      return vehicleBodyTypes['FLATBED_TRUCK']

    case '5D':
    case 'HATC':
    case 'HB':
      return vehicleBodyTypes['HATCHBACK']

    case 'HRSE':
      return vehicleBodyTypes['HEARSE']

    case 'LIM':
      return vehicleBodyTypes['LIMOUSINE']

    case 'MC':
    case 'MCY':
    case 'MOT':
    case 'MOTO':
      return vehicleBodyTypes['MOTORCYCLE']

    case 'MOPD':
    case 'MP':
      return vehicleBodyTypes['MOPED']

    case 'P-U':
    case 'PICK':
    case 'PK':
    case 'PKUP':
      return vehicleBodyTypes['PICKUP_TRUCK']

    case 'REF':
    case 'REFG':
      return vehicleBodyTypes['REFRIGERATION_TRUCK']

    case 'H/WH':
    case 'RV':
      return vehicleBodyTypes['RV']

    case '2 DR':
    case '2D':
    case '2DSD':
    case '2S':
    case '4 DR':
    case '4D':
    case '4DOO':
    case '4DSD':
    case '4DSE':
    case '4DSW':
    case '4S':
    case 'COUP':
    case 'FODO':
    case 'FOUR':
    case 'PASS':
    case 'SD':
    case 'SDN':
    case 'SEDA':
    case 'SEDN':
    case 'TWOD':
      return vehicleBodyTypes['SEDAN']

    case 'SEMI':
      return vehicleBodyTypes['SEMI_TRAILER']

    case 'MOBL':
      return vehicleBodyTypes['SNOWMOBILE']

    case 'ST':
    case 'STAK':
      return vehicleBodyTypes['STAKE_TRUCK']

    case 'SW':
    case 'WAGN':
    case 'WG':
      return vehicleBodyTypes['STATION_WAGON']

    case '4H':
    case '4W':
    case 'LL':
    case 'SPOR':
    case 'SU':
    case 'SUBN':
    case 'SUBU':
    case 'SV':
      return vehicleBodyTypes['SUV']

    case 'TANK':
      return vehicleBodyTypes['TANK_TRUCK']

    case 'TAXI':
      return vehicleBodyTypes['TAXI']

    case 'TOW':
      return vehicleBodyTypes['TOW_TRUCK']

    case 'TR/E':
      return vehicleBodyTypes['TRACTION_ENGINE']

    case 'TRAC':
      return vehicleBodyTypes['TRACTOR']

    case 'T/CR':
      return vehicleBodyTypes['TRACTOR_CRANE']

    case 'TLR':
    case 'TRAI':
    case 'TRL':
    case 'TRLR':
      return vehicleBodyTypes['TRAILER']

    case 'DELV':
    case 'SWT':
    case 'TK':
    case 'TR':
    case 'TRC':
    case 'TRK':
    case 'TRT':
    case 'TRUC':
    case 'Truc':
      return vehicleBodyTypes['TRUCK']

    case 'TR/C':
      return vehicleBodyTypes['TRUCK_CRANE']

    case 'UT':
    case 'UTIL':
      return vehicleBodyTypes['UTILITY_VEHICLE']

    case 'PV':
    case 'VA':
    case 'VAN':
    case 'Van':
    case 'VN':
      return vehicleBodyTypes['VAN']

    default:
      return vehicleBodyTypes['UNKNOWN_BODY_TYPE']
  }
}

const getViolationBorough = async (
  normalizedAddress,
  originalAddress,
  plateId,
  registrationState,
  summonsNumber,
) => {
  const loggingKey = `[summons_number=${summonsNumber}][vehicle=${registrationState}:${plateId}]`

  console.log(
    loggingKey,
    `Attempting to retrieve borough for lookup string '${normalizedAddress}'`
  )

  console.log(
    loggingKey,
    `obtaining mutex for address search for ${normalizedAddress}`
  )

  // Request a lock guarding geocode search
  const unlock = await GEOCODE_MUTEX.lock()

  console.log(
    loggingKey,
    `obtained mutex for address search for ${normalizedAddress}`
  )

  let boroughFromLocation

  try {
    boroughFromLocation = await connection
      .promiseQuery("select borough from geocodes WHERE lookup_string = ?", [
        normalizedAddress + " New York NY",
      ])
      .then(async (results) => {
        if (results.length) {
          console.log(
            loggingKey,
            `Retrieved geocode from database: '${results[0].borough}' for lookup string`,
            `'${normalizedAddress}' from original '${originalAddress}'`
          )
          return results[0].borough
        } else {
          console.log(
            loggingKey,
            `No geocode found in database for lookup string`,
            `'${normalizedAddress}' from original '${originalAddress}'`
          )
          console.log(
            loggingKey,
            `Retrieving geocode from Google for lookup string`,
            `'${normalizedAddress}' from original '${originalAddress}'`
          )
          return await retrieveBoroughFromGeocode(normalizedAddress, loggingKey)
        }
      })
  } finally {
    // release mutex
    unlock()

    console.log(
      loggingKey,
      `released mutex for address search for ${normalizedAddress}`
    )
  }

  return boroughFromLocation
}

const getViolationCodesResponse = (violationCodes) => {
  return "hello"
}

const getViolationLocation = (violation) => {
  let fullStreetName

  const houseNumber = violation.house_number
  const street1 = violation.street_name
  const street2 = violation.intersecting_street

  if (houseNumber && street1 && street2) {
    if (street1.length === 20 && street1.charAt(street1.length - 1) !== " ") {
      fullStreetName = houseNumber + " " + street1 + street2
    } else {
      fullStreetName = houseNumber + " " + street1 + " " + street2
    }
  } else if (street1 && street2) {
    if (street1.length === 20 && street1.charAt(street1.length - 1) !== " ") {
      fullStreetName = street1 + street2
    } else {
      fullStreetName = street1 + " " + street2
    }
  } else if (street1 && houseNumber) {
    if (
      houseNumber.length === 20 &&
      houseNumber.charAt(houseNumber.length - 1) !== " "
    ) {
      fullStreetName = houseNumber + street1
    } else {
      fullStreetName = houseNumber + " " + street1
    }
  } else if (street1) {
    fullStreetName = street1
  }

  if (fullStreetName) {
    if (fullStreetName.match(/@\w/)) {
      fullStreetName = fullStreetName.replace(/@(\w)/, "@ $1")
    }

    fullStreetName = fullStreetName
      .split(/\s/)
      .filter((strPart) => strPart.replace(/\(?[ENSW]\/?B\)?/i, "") !== "")
      .map((strPart) => strPart.toLowerCase())
      .map((strPart) => strPart.charAt(0).toUpperCase() + strPart.substr(1))
      .join(" ")

    return fullStreetName
  }

  return null
}

const getViolationFineData = (violation) => {
  let fined = null

  if (violation.fine_amount) {
    fined = parseFloat(violation.fine_amount)
  }
  if (violation.penalty_amount) {
    fined += parseFloat(violation.penalty_amount)
  }
  if (violation.interest_amount) {
    fined += parseFloat(violation.interest_amount)
  }

  return {
    ...(fined && { fined }),
    ...(violation.payment_amount && {
      paid: parseFloat(violation.payment_amount),
    }),
    ...(violation.reduction_amount && {
      reduced: parseFloat(violation.reduction_amount),
    }),
    ...(violation.amount_due && {
      outstanding: parseFloat(violation.amount_due),
    }),
  }
}

const getViolationFormattedTime = (violation) => {
  // Violations have their date and time in two separate fields
  // that need to be combined into a single datetime.
  //
  // violation.issue_date is a timezone-naive value that
  // is always midnight for a particular date.
  const violationDate = violation.issue_date
  const violationTime = violation.violation_time

  if (violationDate) {
    const dateMatch = violationDate.match("T")
    let date = dateMatch ? violationDate.split("T")[0] : violationDate

    let formattedTime

    if (violationTime) {
      const isAM = violationTime.includes("A")
      const isPM = violationTime.includes("P")

      const fourDigitTimeMatch = violationTime.match(/\d{4}/)
      const fourDigitWithColonTimeMatch = violationTime.match(/\d{2}:\d{2}/)

      let hour
      let minute

      if (fourDigitTimeMatch) {
        // e.g. value is '0521P'
        hour = fourDigitTimeMatch[0].substring(0, 2)
        minute = fourDigitTimeMatch[0].substring(2, 4)
      } else if (fourDigitWithColonTimeMatch) {
        // e.g. value is '05:21P'
        hour = fourDigitWithColonTimeMatch[0].split(":")[0]
        minute = fourDigitWithColonTimeMatch[0].split(":")[1]
      }

      // Change 12-hour PM format to 24-hour format
      if (isPM && parseInt(hour) < 12) {
        // e.g. hour is '05' and time is PM
        hour = (parseInt(hour) + 12).toString()
      } else if (isAM && parseInt(hour) === 12) {
        // e.g. hour is '12' and time is AM
        hour = "00"
      }

      // If violation date in MM/DD/YYYY format
      if (date?.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        // replace slashes with dashes
        const [month, day, year] = date.split("/")

        formattedTime = `${year}-${month}-${day}T${hour}:${minute}`
      } else {
        formattedTime = `${date}T${hour}:${minute}`
      }
    } else {
      // If no time data, just assume midnight (Eastern).

      // replace slashes with dashes
      date = date.replace(/\//g, "-")

      formattedTime = `${date} 00:00`
    }

    const violationTimeInEasternTime = DateTime.fromISO(formattedTime, {
      zone: "America/New_York",
    })

    return {
      formatted_time: violationTimeInEasternTime,
      formatted_time_eastern: violationTimeInEasternTime,
      formatted_time_utc: violationTimeInEasternTime.toUTC(),
    }
  }

  return violation
}

const getViolationStatus = (violationStatusish) => {
  if (!violationStatusish) {
    return undefined
  }

  switch (violationStatusish) {
    case 'ADMIN CLAIM DENIED':
      return violationStatuses['ADMINISTRATIVE_CLAIM_DENIED']

    case 'ADMIN CLAIM GRANTED':
      return violationStatuses['ADMINISTRATIVE_CLAIM_GRANTED']

    case 'ADMIN REDUCTION':
      return violationStatuses['ADMINISTRATIVE_REDUCTION']

    case 'APPEAL ABANDONED':
      return violationStatuses['APPEAL_ABANDONED']

    case 'APPEAL AFFIRMED':
      return violationStatuses['APPEAL_AFFIRMED']

    case 'APPEAL MODIFIED':
      return violationStatuses['APPEAL_MODIFIED']

    case 'APPEAL REMANDED':
      return violationStatuses['APPEAL_REMANDED']

    case 'APPEAL REVERSED':
      return violationStatuses['APPEAL_REVERSED']

    case 'HEARING ADJOURNMENT':
      return violationStatuses['HEARING_ADJOURNED']

    case 'HEARING HELD-GUILTY':
      return violationStatuses['HEARING_HELD_GUILTY']

    case 'HEARING HELD-GUILTY REDUCTION':
      return violationStatuses['HEARING_HELD_GUILTY_REDUCTION']

    case 'HEARING HELD-NOT GUILTY':
      return violationStatuses['HEARING_HELD_NOT_GUILTY']

    case 'HEARING HELD-REINSTATEMENT':
      return violationStatuses['HEARING_HELD_FINES_REINSTATED']

    case 'HEARING PENDING':
      return violationStatuses['HEARING_PENDING']

    case 'HEARING WAIVED':
      return violationStatuses['HEARING_WAIVED']

    default:
      return violationStatuses['UNKNOWN']
  }
}

/**
 * Returns unique link to howsmydrivingny.nyc website for lookup
 *
 * @param {string} uniqueIdentifier - 8-digit alphanumeric code that uniquely identifies this lookup
 */
const getWebsitePlateLookupLink = (uniqueIdentifier) =>
  `${HOWS_MY_DRIVING_NY_WEBSITE_URL}/${uniqueIdentifier}`

const handleAxiosErrors = (error) => {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    console.log("Non-2xx response")
    console.log(error.response.data)
    console.log(error.response.status)
    console.log(error.response.headers)
  } else if (error.request) {
    // The request was made but no response was received
    // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
    // http.ClientRequest in node.js
    console.log(
      `No response received for ${error.config?.method} request to ${error.config?.url}`
    )
  } else {
    // Something happened in setting up the request that triggered an Error
    console.log("Error", error.message)
  }
  console.log(error.config)
}

const handleBlockEvent = (event) => {
  console.log(`handleBlockEvent is a stub method: ${JSON.stringify(event)}`)
}

const handleDirectMessageEvent = (event, users) => {
  if (event.type === "message_create") {
    const messageCreateData = event.message_create
    let photoURL = null

    console.log("\n\n")
    console.log(`message create data: ${JSON.stringify(messageCreateData)}`)
    console.log("\n\n")

    const senderId = messageCreateData.sender_id

    const sender = users[senderId]

    // # photo_url data
    if (messageCreateData.message_data) {
      const md = messageCreateData.message_data

      if (md.attachment) {
        const att = md.attachment

        if (att.media) {
          const media = att.media

          if (media.type === "photo") {
            photoURL = media.media_url_https
          }
        }
      }
    }

    if (
      sender &&
      event.message_create.target.recipient_id === "976593574732222465"
    ) {
      const newEvent = {
        event_type: "direct_message",
        event_id: event.id,
        user_handle: sender.screen_name,
        user_id: sender.id,
        event_text: messageCreateData.message_data.text,
        created_at: event.created_timestamp,
        in_reply_to_message_id: null,
        location: null,
        responded_to: false,
      }

      console.log(`new TwitterEvent: ${JSON.stringify(newEvent)}`)

      connection.query(
        "insert into twitter_events set ?",
        newEvent,
        (error, results, fields) => {
          if (error) {
            console.log(`error thrown at: ${new Date()}`)
            throw error
          }

          if (results && photoURL != null) {
            const insertID = results.insertId

            const mediaObject = {
              url: photoURL,
              type: "photo",
              twitter_event_id: insertID,
            }

            connection.query(
              "insert into twitter_media_objects set ?",
              mediaObject,
              (error, results, fields) => {
                if (error) {
                  console.log(`error thrown at: ${new Date()}`)
                  throw error
                }
              }
            )
          }
        }
      )
    }
  }
}

const handleDirectMessageIndicateTypingEvent = (event) => {
  console.log(
    `handleDirectMessageIndicateTypingEvent is a stub method: ${JSON.stringify(
      event
    )}`
  )
}
const handleDirectMessageMarkReadEvent = (event) => {
  console.log(
    `handleDirectMessageMarkReadEvent is a stub method: ${JSON.stringify(
      event
    )}`
  )
}
const handleFavoriteEvent = (event) => {
  const favoritedStatusId =
    event && event.favorited_status && event.favorited_status.id_str
  const userId = event && event.user && event.user.id_str

  if (favoritedStatusId && userId) {
    connection.query(
      "select CAST(in_reply_to_message_id as CHAR(20)) as in_reply_to_message_id from non_follower_replies where event_id = ? and user_id = ? and favorited = false",
      [favoritedStatusId, userId],
      (error, results, fields) => {
        if (error) {
          console.log(`error thrown at: ${new Date()}`)
          throw error
        }

        if (results && results[0]) {
          const inReplyToMessageId = results[0].in_reply_to_message_id
          console.log(
            `Setting responded_to to false for event_id: ${inReplyToMessageId}`
          )
          respondToNonFollowerFavorite(
            favoritedStatusId,
            inReplyToMessageId,
            userId
          )
        } else {
          console.log("No message matches.")
          console.log(`favorited status id: ${favoritedStatusId}`)
          console.log(`favoriting user id: ${userId}`)
        }
      }
    )
  }
}

const handleFollowEvent = (event) => {
  const userId = event && event.source && event.source.id

  console.log(`userId: ${userId}`)

  if (userId) {
    connection.query(
      "select CAST(in_reply_to_message_id as CHAR(20)) as in_reply_to_message_id from non_follower_replies where user_id = ? and favorited = false",
      [userId],
      (error, results, fields) => {
        if (error) {
          console.log(`error thrown at: ${new Date()}`)
          throw error
        }

        if (results && results.length > 0) {
          results.forEach((result) => {
            const inReplyToMessageId = results[0].in_reply_to_message_id
            respondToReplyForNewFollower(inReplyToMessageId, userId)
          })
        } else {
          console.log("No messages match.")
          console.log(`following user id: ${userId}`)
        }
      }
    )
  }
}

const handleMuteEvent = (event) => {
  console.log(`handleMuteEvent is a stub method: ${JSON.stringify(event)}`)
}

/**
 * Creates tweets by parsing response text into chunks that fall below the maxt tweet length.
 *
 * @param {Object<string,any>} collection            - The summary data (e.g. years, boroughs, violation types)
 *                                                     we are working with
 * @param {string}             prefixFormatString    - The prefix string for the first tweet about this summary type
 * @param {string}             continuedFormatString - The prefix string for every tweet about this summary type
 *                                                     after the first tweet
 * @param {string}             defaultDescription    - The placeholder to use when a summary data type field is missing
 *                                                     e.g. 'No year available' when a violation has no datetime
 */
const handleResponsePartFormation = (
  collection,
  prefixFormatString,
  continuedFormatString,
  defaultDescription
) => {
  // collect the responses
  const responseContainer = []

  // # Initialize current string to prefix
  let curString = ""

  if (prefixFormatString) {
    curString += prefixFormatString
  }

  const keyWithMostViolations = getCollectionKeyWithMostViolations(collection)
  const maxCountLength = keyWithMostViolations
    ? collection[keyWithMostViolations].toString().length
    : 0

  const spacesNeeded = maxCountLength * 2 + 1

  const objectEntries = Object.entries(collection)

  // Grab item
  objectEntries.forEach(([key, violationCountForKey]) => {
    // Titleize for readability.
    const description =
      key.replace(/\b[a-z]/g, (firstLetterOfWord) =>
        firstLetterOfWord.toUpperCase()
      ) || defaultDescription

    const countLength = violationCountForKey.toString().length

    // # e.g., if spaces_needed is 5, and count_length is 2,
    // we need to pad to 3.
    const leftJustifyAmount = spacesNeeded - countLength

    // formulate next string part
    const nextPart = `${violationCountForKey
      .toString()
      .padEnd(leftJustifyAmount)}| ${description}\n`

    // #etermine current string length
    const potentialResponseLength = (curString + nextPart).length

    // If violation string so far and new part are less or
    // equal than 280 characters, append to existing tweet string.
    if (potentialResponseLength <= MAX_TWITTER_STATUS_LENGTH) {
      curString += nextPart
    } else {
      responseContainer.push(curString)
      if (continuedFormatString) {
        curString = continuedFormatString
      }
      curString += nextPart
    }
  })

  // If we finish the list with a non-empty string,
  // append that string to response parts
  if (curString.length !== 0) {
    // Append ready string into parts for response.
    responseContainer.push(curString)
  }

  // Return parts
  return responseContainer
}

const handleTweetCreateEvent = (event) => {
  if (
    !event.retweeted_status &&
    event.user &&
    event.user.screen_name !== "HowsMyDrivingNY"
  ) {
    let text
    let userMentions = null
    let userMentionIDs = null

    const photoURLs = []

    if (event.extended_tweet) {
      const et = event.extended_tweet
      text = et.full_text

      if (et.entities.user_mentions) {
        userMentions = et.entities.user_mentions
          .map((mention) =>
            text.includes(mention.screen_name) ? mention.screen_name : ""
          )
          .join(" ")
          .trim()
        userMentionIDs = et.entities.user_mentions
          .map((mention) => mention.id_str)
          .join(",")
          .trim()
      }

      if (et.extended_entities) {
        const ee = et.extended_entities

        if (ee.media) {
          const media = ee.media

          media.forEach((med) => {
            if (med.type === "photo") {
              photoURLs.push(med.media_url_https)
            }
          })
        }
      }
    } else {
      text = event.text

      if (event.entities) {
        const entities = event.entities

        if (entities.user_mentions) {
          userMentions = entities.user_mentions
            .map((mention) =>
              text.includes(mention.screen_name) ? mention.screen_name : ""
            )
            .join(" ")
            .trim()
          userMentionIDs = entities.user_mentions
            .map((mention) => mention.id_str)
            .join(",")
            .trim()
        }
      }

      if (event.extended_entities) {
        const ee = event.extended_entities

        if (ee.media) {
          const media = ee.media

          media.forEach((med) => {
            if (med.type === "photo") {
              photoURLs.push(med.media_url_https)
            }
          })
        }
      }
    }

    const newEvent = {
      event_type: "status",
      event_id: event.id_str,
      user_handle: event.user.screen_name,
      user_id: event.user.id_str,
      user_mentions: userMentions
        ? userMentions.substring(userMentions.length - 560)
        : null,
      user_mention_ids: userMentionIDs,
      event_text: text.substring(text.length - 560),
      created_at: event.timestamp_ms,
      in_reply_to_message_id: event.in_reply_to_status_id_str,
      location:
        event.place && event.place.full_name ? event.place.full_name : null,
      responded_to: false,
    }

    console.log("\n\n")
    console.log(`new TwitterEvent: ${JSON.stringify(newEvent)}`)
    console.log("\n\n")

    connection.query(
      "insert into twitter_events set ?",
      newEvent,
      (error, results, fields) => {
        if (error) {
          console.log(`error thrown at: ${new Date()}`)
          throw error
        }

        if (results && photoURLs.length > 0) {
          const insertID = results.insertId

          const mediaObjects = photoURLs.map((photoURL) => {
            return {
              url: photoURL,
              type: "photo",
              twitter_event_id: insertID,
            }
          })

          connection.query(
            "insert into twitter_media_objects set ?",
            mediaObjects,
            (error, results, fields) => {
              if (error) {
                console.log(`error thrown at: ${new Date()}`)
                throw error
              }
            }
          )
        }
      }
    )
  }
}

const handleTweetDeleteEvent = (event) => {
  console.log(
    `handleTweetDeleteEvent is a stub method: ${JSON.stringify(event)}`
  )
}
const handleUnblockEvent = (event) => {
  console.log(`handleUnblockEvent is a stub method: ${JSON.stringify(event)}`)
}
const handleUnfollowEvent = (event) => {
  console.log(`handleUnfollowEvent is a stub method: ${JSON.stringify(event)}`)
}
const handleUnmuteEvent = (event) => {
  console.log(`handleUnmuteEvent is a stub method: ${JSON.stringify(event)}`)
}
const handleUserEvent = (event) => {
  console.log(`handleUserEvent is a stub method: ${JSON.stringify(event)}`)
}

const insertNewLookup = (newLookup, callback) => {
  connection.query("insert into plate_lookups set ?", newLookup, callback)
}

/**
 * Open Parking And Camera Violation data (https://data.cityofnewyork.us/resource/nc67-uf89.json)
 * does not have a violation code, but rather a string field 'description' that contains the
 * violation description. However, sometimes the violations are outdated, using descriptions that
 * used to correspond to those violation codes, but have since been replaced with newer ones.
 * As such, we need to convert the description into to a violation code and then use the date to
 * determine what the correct violation should be.
 *
 * @param {string} violationDescription
 * @returns {string}
 */
const inferViolationCodeFromOpenParkingAndCameraViolationDescription = (violationDescription) => {
  if (violationDescription in namesToCodes) {
    return namesToCodes[violationDescription]
  }
  return violationDescription
}

/**
 * Indicates whether a value represents a number
 *
 * @param {any} possibleNumber a possible number of any type
 * @returns {boolean} whether or not possibleNumber is a number
 */
const isNumber = (possibleNumber) =>
  !!possibleNumber !== possibleNumber && !isNaN(Number(possibleNumber))

/**
 * Request the metadata for all the violation databases
 */
const makeOpenDataMetadataRequest = async () => {
  const allEndpoints = FISCAL_YEAR_PATHS.concat(OPEN_PARKING_AND_CAMERA_VIOLATIONS_PATH)

  const promises = allEndpoints.map(async (endpoint) => {
    const resourceIdentifier = endpoint.replace('/resource/', '')
    const metadataUrl = new URL(resourceIdentifier, NYC_OPEN_DATA_PORTAL_METADATA_PREFIX)

    return axios.get(metadataUrl.toString())
  })

  return await Promise.all(promises)
}

const makeOpenDataVehicleRequests = async (plate, state, plateTypes) => {
  let rectifiedPlate = plate

  try {
    possibleMedallionPlate = await retrievePossibleMedallionVehiclePlate(plate)
    if (possibleMedallionPlate) {
      rectifiedPlate = possibleMedallionPlate
    }
  } catch (error) {
    console.error(error)
  }

  console.log("\n\n")
  console.log("in makeOpenDataVehicleRequests")
  console.log(`rectifiedPlate: ${rectifiedPlate}`)
  console.log(`state: ${state.toUpperCase()}`)
  console.log("\n\n")

  const fiscalYearSearchParams = new URLSearchParams({
    $$app_token: "q198HrEaAdCJZD4XCLDl2Uq0G",
    $limit: 10000,
    plate_id: encodeURIComponent(rectifiedPlate.toUpperCase()),
    registration_state: state.toUpperCase(),
  })

  if (plateTypes) {
    const plateTypesArray = plateTypes.map(
      (item) => `'${item.toUpperCase().trim()}'`
    )

    const plateTypesQueryValue = `plate_type in(${plateTypesArray.join()})`

    fiscalYearSearchParams.append("$where", plateTypesQueryValue)
  }

  // if (fieldsForExternalRequests) {
  //   queryString += '&$select=' + fieldsForExternalRequests.join(',')
  // }

  // Checking for selected fields for violations
  // const violations = [];
  // const fieldsForExternalRequests = 'violations' in selectedFields ? Object.keys(selectedFields['violations']) : {}

  // Fiscal Year Databases
  const promises = FISCAL_YEAR_PATHS.map(async (path) => {
    const endpoint = `${NYC_OPEN_DATA_PORTAL_HOST}${path}`
    const fiscalYearUrlObject = new URL(`?${fiscalYearSearchParams}`, endpoint)
    return axios.get(fiscalYearUrlObject.toString()).catch(handleAxiosErrors)
  })

  // Open Parking & Camera Violations Database
  const openParkingAndCameraViolationsSearchParams = new URLSearchParams({
    $$app_token: "q198HrEaAdCJZD4XCLDl2Uq0G",
    $limit: 10000,
    plate: encodeURIComponent(rectifiedPlate.toUpperCase()),
    state: state.toUpperCase(),
  })

  if (plateTypes) {
    const plateTypesArray = plateTypes.map(
      (item) => `'${item.toUpperCase().trim()}'`
    )

    const plateTypesQueryValue = `license_type in(${plateTypesArray.join()})`

    openParkingAndCameraViolationsSearchParams.append(
      "$where",
      plateTypesQueryValue
    )
  }

  // if (fieldsForExternalRequests) {
  //   opacvQueryString += '&$select=' + fieldsForExternalRequests.join(',')
  // }

  const urlObject = new URL(
    `?${openParkingAndCameraViolationsSearchParams}`,
    `${NYC_OPEN_DATA_PORTAL_HOST}${OPEN_PARKING_AND_CAMERA_VIOLATIONS_PATH}`
  )

  promises.push(axios.get(urlObject.toString()).catch(handleAxiosErrors))

  const responses = await Promise.all(promises)

  return responses
}

const mergeDuplicateViolationRecords = (violations) => {
  const accum = []

  violations.forEach((object) => {
    const existing = accum.filter((violation, i) => {
      return violation.summons_number === object.summons_number
    })
    if (existing.length) {
      const existingIndex = accum.indexOf(existing[0])
      const existingItem = accum[existingIndex]

      // Handle database data differently, since it must be combined
      const mergedObject = {
        from_databases: [
          ...existingItem["from_databases"],
          ...object["from_databases"],
        ],
        sanitized: {
          issuing_agency:
            existingItem["sanitized"].issuing_agency ?? object["sanitized"].issuing_agency,
            vehicle_body_type:
            existingItem["sanitized"].vehicle_body_type ?? object["sanitized"].vehicle_body_type,
          violation_status:
            existingItem["sanitized"].violation_status ?? object["sanitized"].violation_status,
        }
      }

      Object.keys(existingItem).forEach((key) => {
        if (!(["from_databases", "sanitized"].includes(key))) {
          mergedObject[key] = existingItem[key] || object[key]
        }
      })

      Object.keys(object).forEach((key) => {
        if (!(["from_databases", "sanitized"].includes(key))) {
          mergedObject[key] = existingItem[key] || object[key]
        }
      })

      accum[existingIndex] = mergedObject
    } else {
      accum.push(object)
    }
  })

  return accum
}

const modifyViolationsForResponse = (violations, selectedFields) =>
  violations.map((violation) =>
    Object.fromEntries(
      Object.entries(violation).sort()
    )
  )

const normalizeViolations = async (requestPathname, violations, dataUpdatedAt) => {
  const violationsWithBoroughs = await Promise.all(
    violations.map(async (violation) => {
      // Let's get a human-readable address
      const addressOrLocation = getViolationLocation(violation)

      const standardizedLocation = addressOrLocation
        ? standardizeDisplayedLocation(addressOrLocation).trim()
        : undefined

      // If we already have the borough, use it.
      const potentialBorough = violation.violation_county || violation.county

      if (potentialBorough) {
        const borough = counties[potentialBorough]
        if (borough) {
          return {
            ...violation,
            location: standardizedLocation,
            violation_county: borough,
          }
        }
      }

      // If we have the precinct, we can use that instead.
      const potentialPrecinct = violation.violation_precinct || violation.precinct

      if (potentialPrecinct && isNumber(potentialPrecinct)) {
        const violationPrecinct = parseInt(potentialPrecinct).toString()
        if (violationPrecinct in precinctsByBorough) {
          return {
            ...violation,
            location: standardizedLocation,
            violation_county: precinctsByBorough[violationPrecinct],
          }
        }
      }

      if (!addressOrLocation) {
        return {
          ...violation,
          location: undefined,
          violation_county: "No Borough Available"
        }
      }

      const violationBorough = await getViolationBorough(
        standardizedLocation,
        addressOrLocation,
        violation.plate_id,
        violation.registration_state,
        violation.summons_number,
      )

      return {
        ...violation,
        location: standardizedLocation,
        violation_county: violationBorough
      }
    })
  )

  const returnViolations = violationsWithBoroughs.map((violation) => {
    const readableViolationDescription =
      getReadableViolationDescription(violation)

    const {
      formatted_time,
      formatted_time_eastern,
      formatted_time_utc,
    } = getViolationFormattedTime(violation)

    // When violation time is after now, filter it out.
    if (new Date() < formatted_time_utc) {
      return undefined
    }

    const {
      fined,
      outstanding,
      paid,
      reduced,
    } = getViolationFineData(violation)

    const standardizedJudgmentEntryDate = violation.judgment_entry_date
      ? DateTime.fromFormat(violation.judgment_entry_date, "MM/dd/yyyy", {
          locale: "en-US",
        }).toISODate()
      : null

    const newViolation = {
      amount_due: isNaN(parseFloat(violation.amount_due))
        ? null
        : parseFloat(violation.amount_due),
      date_first_observed: violation.date_first_observed || null,
      days_parking_in_effect: violation.days_parking_in_effect || null,
      feet_from_curb: violation.feet_from_curb || null,
      fine_amount: isNaN(parseFloat(violation.fine_amount))
        ? null
        : parseFloat(violation.fine_amount),
      fined,
      formatted_time,
      formatted_time_eastern,
      formatted_time_utc,
      from_databases: [
        {
          dataUpdatedAt,
          endpoint: `${NYC_OPEN_DATA_PORTAL_HOST}${requestPathname}`,
          name: FISCAL_YEAR_PATHS_TO_DATABASE_NAMES_MAP[requestPathname],
        },
      ],
      from_hours_in_effect: violation.from_hours_in_effect || null,
      house_number: violation.house_number || null,
      humanized_description: readableViolationDescription,
      interest_amount: isNaN(parseFloat(violation.interest_amount))
        ? null
        : parseFloat(violation.interest_amount),
      intersecting_street: violation.intersecting_street || null,
      issue_date: violation.issue_date || null,
      issuer_code: violation.issuer_code || null,
      issuer_command: violation.issuer_command || null,
      issuer_precinct: isNaN(parseInt(violation.issuer_precinct))
        ? null
        : parseInt(violation.issuer_precinct),
      issuing_agency: violation.issuing_agency || null,
      judgment_entry_date: standardizedJudgmentEntryDate,
      location: violation.location || null,
      law_section: violation.law_section || null,
      outstanding,
      paid,
      payment_amount: isNaN(parseFloat(violation.payment_amount))
        ? null
        : parseFloat(violation.payment_amount),
      penalty_amount: isNaN(parseFloat(violation.penalty_amount))
        ? null
        : parseFloat(violation.penalty_amount),
      plate_id: violation.plate_id || violation.plate || null,
      plate_type: violation.plate_type || violation.license_type || null,
      reduced,
      reduction_amount: isNaN(parseFloat(violation.reduction_amount))
        ? null
        : parseFloat(violation.reduction_amount),
      registration_state: violation.registration_state || violation.state || null,
      sanitized: {
        issuing_agency: getIssuingAgency(violation.issuing_agency) || null,
        vehicle_body_type: getVehicleBodyType(violation.vehicle_body_type),
        violation_status: getViolationStatus(violation.violation_status),
      },
      street_code1: violation.street_code1 || null,
      street_code2: violation.street_code2 || null,
      street_code3: violation.street_code3 || null,
      street_name: violation.street_name || null,
      sub_division: violation.sub_division || null,
      summons_image: violation.summons_image || null,
      summons_number: violation.summons_number || null,
      to_hours_in_effect: violation.to_hours_in_effect || null,
      vehicle_body_type: violation.vehicle_body_type || null,
      vehicle_color: violation.vehicle_color || null,
      vehicle_expiration_date: violation.vehicle_expiration_date || null,
      vehicle_make: violation.vehicle_make || null,
      vehicle_year: violation.vehicle_year || null,
      violation_code:
        violation.violation_code ||
        namesToCodes[readableViolationDescription] ||
        null,
      violation_county: violation.violation_county || null,
      violation_in_front_of_or_opposite:
        violation.violation_in_front_of_or_opposite || null,
      violation_legal_code: violation.violation_legal_code || null,
      violation_location: violation.violation_location || null,
      violation_post_code: violation.violation_post_code || null,
      violation_precinct: isNaN(
        parseInt(violation.violation_precinct || violation.precinct)
      )
        ? null
        : parseInt(violation.violation_precinct || violation.precinct),
      violation_status: violation.violation_status || null,
      violation_time: violation.violation_time || null,
    }

    return newViolation
  })

  return Promise.all(returnViolations)
}

const obtainUniqueIdentifier = async () => {
  const identifierAlreadyExists = (identifier) => {
    return new Promise((resolve, reject) => {
      connection.query(
        "select count(*) as count from plate_lookups where unique_identifier = ?",
        [identifier],
        (error, results, fields) => {
          if (error) {
            console.log(`error thrown at: ${new Date()}`)
            throw error
          }
          return resolve(
            !!(results && results[0] && results[0] && results[0].count !== 0)
          )
        }
      )
    })
  }

  const getUniqueIdentifier = () => Math.random().toString(36).substring(2, 10)
  let uniqueIdentifier = getUniqueIdentifier()

  while (
    await identifierAlreadyExists(uniqueIdentifier).catch((error) => {
      throw error
    })
  ) {
    uniqueIdentifier = getUniqueIdentifier()
  }
  return uniqueIdentifier
}

const queryDatabaseForLookups = (queryString, queryArgs, callback) => {
  connection.query(queryString, queryArgs, callback)
}

const respondToReplyForNewFollower = (inReplyToMessageId, userId) => {
  console.log(`inReplyToMessageId: ${inReplyToMessageId}`)
  console.log(`userId: ${userId}`)

  connection.query(
    `
    update non_follower_replies set favorited = true where user_id = ?;
    update twitter_events set user_favorited_non_follower_reply = true, responded_to = false where event_id = ?
  `,
    [userId, inReplyToMessageId],
    (error, results, fields) => {
      if (error) {
        console.log(`error thrown at: ${new Date()}`)
        throw error
      }
    }
  )
}

const respondToNonFollowerFavorite = (
  favoritedStatusId,
  inReplyToMessageId,
  userId
) => {
  console.log(
    `Updating twitter_events, setting user_favorited_non_follower_reply = true and responded_to = false for event ${inReplyToMessageId}`
  )
  connection.query(
    `
    update non_follower_replies set favorited = true where event_id = ? and user_id = ?;
    update twitter_events set user_favorited_non_follower_reply = true, responded_to = false where event_id = ? and is_duplicate = false
  `,
    [favoritedStatusId, userId, inReplyToMessageId],
    (error, results, fields) => {
      if (error) {
        console.log(`error thrown at: ${new Date()}`)
        throw error
      }
    }
  )
}

const retrieveBoroughFromGeocode = (location, loggingKey) => {
  return googleMapsClient
    .geocode({
      address: location,
      components: {
        country: 'U.S.',
        locality: 'New York',
      },
    })
    .asPromise()
    .then(
      (response) => {
        const geocodeResult = response?.json?.results[0]
        if (!geocodeResult?.address_components?.length) {
          console.log(
            loggingKey,
            'No geocode result or result has insufficient data'
          )
          return "No Borough Available"
        }

        // Get latidude & longitude from address.
        // const { lat, lng } = geocodeResult.geometry.location
        const borough = geocodeResult.address_components.find(
          (elem) => elem.types[2] === "sublocality_level_1"
        )

        const potentiallyNewYorkCity = geocodeResult.address_components.find(
          (elem) => elem.types.includes('administrative_area_level_1')
        )

        if (potentiallyNewYorkCity?.long_name !== 'New York') {
          console.log(
            loggingKey,
            'Returned geocode from Google is not for New York City',
            `Returned city is '${potentiallyNewYorkCity?.long_name}'`
          )
          return "No Borough Available"
        }

        if (!borough?.long_name) {
          console.log(
            loggingKey,
            'Returned geocode from Google does not have a borough'
          )
          return "No Borough Available"
        }

        const newGeocode = {
          lookup_string: `${location.trim()} New York NY`,
          borough: borough.long_name,
          geocoding_service: "google",
        }

        console.log(
          loggingKey,
          `About to insert a geocode (${JSON.stringify(newGeocode)}) in the database`
        )
        connection.query(
          "insert into geocodes set ?",
          newGeocode,
          (error, results, fields) => {
            if (error) {
              console.log(
                loggingKey,
                `error thrown at: ${new Date()}`
              )
              throw error
            }
            console.log(
              loggingKey,
              `Geocode (${JSON.stringify(newGeocode)}) successfully inserted at ${results.insertId}`
            )
          }
        )

        return borough.long_name
      },
      (error) => {
        console.log("\n\n")
        console.log(`There was an error requesting the geocode for ${location}`)
        console.error(error)
        console.log("\n\n")
      }
    )
}

const retrievePossibleMedallionVehiclePlate = async (plate) => {
  const medallionEndpoint =
    "https://data.cityofnewyork.us/resource/rhe8-mgbb.json"

  const medallionEndpointSearchParams = new URLSearchParams({
    $$app_token: "q198HrEaAdCJZD4XCLDl2Uq0G",
    $group: "dmv_license_plate_number",
    $limit: 10000,
    $select: "dmv_license_plate_number, max(last_updated_date)",
    $where: `license_number='${encodeURIComponent(plate.toUpperCase())}'`,
  })

  const medallionUrlObject = new URL(
    `?${medallionEndpointSearchParams}`,
    medallionEndpoint
  )

  try {
    const medallionEndpointResponse = await axios
      .get(medallionUrlObject)
      .catch(handleAxiosErrors)

    const medallionResults = medallionEndpointResponse.data

    if (!medallionResults.length) {
      return plate
    }

    const currentMedallionHolder = medallionResults.reduce((prev, cur) => {
      const previousDate = new Date(prev.max_last_updated_date)
      const currentDate = new Date(cur.max_last_updated_date)
      return currentDate > previousDate ? cur : prev
    })

    return currentMedallionHolder.dmv_license_plate_number
  } catch (error) {
    console.error(error)
  }
}

/**
 *
 * @param {string} location - un-normalized address location
 * @returns string
 */
const standardizeDisplayedLocation = (location) => {
  let standardizedLocation = location

  // Fix specific bad location strings
  standardizedLocation = applyStreetSpecificLocationFixes(standardizedLocation)

  // Strip cruft
  standardizedLocation = standardizedLocation.replace(/-[a-z][0-9a-z]-[0-9]/g, '')
  standardizedLocation = standardizedLocation.replace(/\(n\)/g, '')

  // Replace Abbreviations: at
  standardizedLocation = standardizedLocation.replace(/@/g, ' and ').replace(/@/, " @ ").replace(/\s\s+/g, ' ')

  const numberSuffixRegex = /(st|nd|rd|th)(st|rd|av(e)?)/gi
  standardizedLocation = standardizedLocation.replace(
    numberSuffixRegex,
    (_, x, y) => {
      return `${x} ${y.charAt(0).toUpperCase() + y.slice(1)}`
    },
  )

  // '1' -> '1st' regex
  const firstPrefixRegex = /(?<!1)(1)/g
  standardizedLocation = standardizedLocation.replace(
    new RegExp(firstPrefixRegex.source + placenameRegex.source, 'ig'),
    '1st $2',
  )

  // '11' -> '11th' regex
  const eleventhPrefixRegex = /(11)\b/g
  standardizedLocation = standardizedLocation.replace(
    new RegExp(eleventhPrefixRegex.source + placenameRegex.source, 'ig'),
    '11th $2',
  )

  // '2' -> '2nd' regex
  const secondPrefixRegex = /(?<!1)(2)/g
  standardizedLocation = standardizedLocation.replace(
    new RegExp(secondPrefixRegex.source + placenameRegex.source, 'ig'),
    '2nd $2',
  )

  // '12' -> '12th' regex
  const twelfthPrefixRegex = /(12)\b/g
  standardizedLocation = standardizedLocation.replace(
    new RegExp(twelfthPrefixRegex.source + placenameRegex.source, 'ig'),
    '12th $2',
  )

  // '3' -> '3rd' regex
  const thirdPrefixRegex = /(?<!1)(3)/g
  standardizedLocation = standardizedLocation.replace(
    new RegExp(thirdPrefixRegex.source + placenameRegex.source, 'ig'),
    '3rd $2',
  )

  // '13' -> '13th' regex
  const thirteenthPrefixRegex = /(13)\b/g
  standardizedLocation = standardizedLocation.replace(
    new RegExp(thirteenthPrefixRegex.source + placenameRegex.source, 'ig'),
    '13th $2',
  )

  // '4-9' -> '4th-9th' regex
  const remainderNumberPrefixRegex = /(\d)\b/g
  standardizedLocation = standardizedLocation.replace(
    new RegExp(
      remainderNumberPrefixRegex.source + placenameRegex.source,
      'ig',
    ),
    '$1th $2',
  )

  // Remove (ENSW)-bound
  standardizedLocation = standardizedLocation.replace(/\s*\(e\/b\)\s*/g, ' ')
  standardizedLocation = standardizedLocation.replace(/\s*\(n\/b\)\s*/g, ' ')
  standardizedLocation = standardizedLocation.replace(/\s*\(s\/b\)\s*/g, ' ')
  standardizedLocation = standardizedLocation.replace(/\s*\(w\/b\)\s*/g, ' ')

  standardizedLocation = standardizedLocation.replace(/^[Ee][Bb]\b/g, '')
  standardizedLocation = standardizedLocation.replace(/^[Nn][Bb]\b/g, '')
  standardizedLocation = standardizedLocation.replace(/^[Ss][Bb]\b/g, '')
  standardizedLocation = standardizedLocation.replace(/^[Ww][Bb]\b/g, '')

  // Replace abbreviations: Avenue
  standardizedLocation = standardizedLocation.replace(/\b[Aa]v(e)?\./g, 'Avenue ').replace(/\s\s+/g, ' ').trim()
  standardizedLocation = standardizedLocation.replace(/\b[Aa]v(e)?\b/g, 'Avenue ').replace(/\s\s+/g, ' ').trim()

  // Replace abbreviations: Boulevard
  standardizedLocation = standardizedLocation.replace(/\b[Bb]lv\b/g, 'Boulevard')
  standardizedLocation = standardizedLocation.replace(
    /\b[Bb]lvd\b\./g,
    'Boulevard',
  )
  standardizedLocation = standardizedLocation.replace(/\b[Bb]lvd\b/g, 'Boulevard')
  standardizedLocation = standardizedLocation.replace(/\b[Bb]v\./g, 'Boulevard')
  standardizedLocation = standardizedLocation.replace(/\b[Bb]v\b/g, 'Boulevard')

  // Replace abbreviations: Boulevard
  standardizedLocation = standardizedLocation.replace(/\b[Bb]rg\b/g, 'Bridge')

  // Replace abbreviations: Court
  standardizedLocation = standardizedLocation.replace(/\b[Cc]t\./g, 'Court')
  standardizedLocation = standardizedLocation.replace(/\b[Cc]t\b/g, 'Court')

  // Replace abbreviations: Drive
  standardizedLocation = standardizedLocation.replace(/\b[Dd]r\./g, 'Drive')
  standardizedLocation = standardizedLocation.replace(/\b[Dd]r\b/g, 'Drive')

  // Replace abbreviations: Expressway
  standardizedLocation = standardizedLocation.replace(
    /\b[Ee]xpwy\b\./g,
    'Expressway',
  )
  standardizedLocation = standardizedLocation.replace(
    /\b[Ee]xpwy\b/g,
    'Expressway',
  )

  // Replace abbreviations: Lane
  standardizedLocation = standardizedLocation.replace(/\b[Hh]wy\b\./g, 'Highway')
  standardizedLocation = standardizedLocation.replace(/\b[Hh]wy\b/g, 'Highway')

  // Replace abbreviations: Lane
  standardizedLocation = standardizedLocation.replace(/\b[Ll]n\b\./g, 'Lane')
  standardizedLocation = standardizedLocation.replace(/\b[Ll]n\b/g, 'Lane')

  // Replace abbreviations: Parkway
  standardizedLocation = standardizedLocation.replace(/\b[Pp]kwy\b\./g, 'Parkway')
  standardizedLocation = standardizedLocation.replace(/\b[Pp]kwy\b/g, 'Parkway')

  // Replace abbreviations: Place
  standardizedLocation = standardizedLocation.replace(/\b[Pp]l\b\./g, 'Place')
  standardizedLocation = standardizedLocation.replace(/\b[Pp]l\b/g, 'Place')

  // Replace abbreviations: Road
  standardizedLocation = standardizedLocation.replace(/\b[Rr]d\b\./g, 'Road')
  standardizedLocation = standardizedLocation.replace(/\b[Rr]d\b/g, 'Road')

  // Replace abbreviations: Street
  standardizedLocation = standardizedLocation.replace(/\b[Ss]t\b\./g, 'Street')
  standardizedLocation = standardizedLocation.replace(/\b[Ss]t\b/g, 'Street')

  // Replace abbreviations: Service
  standardizedLocation = standardizedLocation.replace(/\b[Ss]vc\b\./g, 'Service')
  standardizedLocation = standardizedLocation.replace(/\b[Ss]vc\b/g, 'Service')

  // Replace (front|rear)/of
  standardizedLocation = standardizedLocation.replace(
    /(F|f)\/O(f)?/gi,
    '$1ront of',
  )
  standardizedLocation = standardizedLocation.replace(
    /(R|r)\/O(f)?/gi,
    '$1ear of',
  )

  // Replace (ENSW)/of
  standardizedLocation = standardizedLocation.replace(
    /(W|w)\/O(f)?/gi,
    '$1est of',
  )
  standardizedLocation = standardizedLocation.replace(
    /(S|s)\/O(f)?/gi,
    '$1outh of',
  )
  standardizedLocation = standardizedLocation.replace(
    /(N|n)\/O(f)?/gi,
    '$1orth of',
  )
  standardizedLocation = standardizedLocation.replace(
    /(E|e)\/O(f)?/gi,
    '$1ast of',
  )

  // Replace Abbreviations: East
  standardizedLocation = standardizedLocation.replace(
    /(?<!Avenue )\b(E)\b(?!\/)/g,
    'East',
  )
  standardizedLocation = standardizedLocation.replace(
    /(?<!Avenue )\b(E)(\d+)/g,
    'East $2',
  )
  standardizedLocation = standardizedLocation.replace(/\bE\b\./g, 'East ')

  // Replace Abbreviations: North
  standardizedLocation = standardizedLocation.replace(
    /(?<!Avenue )\b(N)\b(?!\/)/g,
    'North',
  )
  standardizedLocation = standardizedLocation.replace(
    /(?<!Avenue )\b(N)(\d+)/g,
    'North $2',
  )
  standardizedLocation = standardizedLocation.replace(/\bN\b\./g, 'North ')

  // Replace Abbreviations: South
  standardizedLocation = standardizedLocation.replace(
    /(?<!Avenue )\b(S)\b(?!\/)/g,
    'South',
  )
  standardizedLocation = standardizedLocation.replace(
    /(?<!Avenue )\b(S)(\d+)/g,
    'South $2',
  )
  standardizedLocation = standardizedLocation.replace(/\bS\b\./g, 'South ')

  // Replace Abbreviations: West
  standardizedLocation = standardizedLocation.replace(
    /(?<!Avenue )\b(W)\b(?!\/)/g,
    'West',
  )
  standardizedLocation = standardizedLocation.replace(
    /(?<!Avenue )\b(W)(\d+)/g,
    'West $2',
  )
  standardizedLocation = standardizedLocation.replace(/\bW\b\./g, 'West ')

  // Replace Abbreviations: feet
  standardizedLocation = standardizedLocation.replace(/(\d)ft/g, '$1 feet')

  // Fix lowercased letters part of house number
  standardizedLocation = standardizedLocation.replace(/(\d[a-z]) /g, (x) =>
    x.toUpperCase(),
  )

  // Title case
  standardizedLocation = standardizedLocation.replace(
    /\w\S*/g,
    (text) => text.charAt(0).toUpperCase() + text.substring(1)
  )

  // Remove title case for directions not at start of string
  standardizedLocation = standardizedLocation.replace(
    /(?<!^)\b(East|North|South|West) Of\b/g,
    (text) => text.toLowerCase()
  )
  // Remove title case for 'side'
  standardizedLocation = standardizedLocation.replace(/\bSide\b/g, 'side')
  // Remove title case for 'of'
  standardizedLocation = standardizedLocation.replace(/\bOf\b/g, 'of')
  // Remove title case for 'and'
  standardizedLocation = standardizedLocation.replace(/\bAnd\b/g, 'and')
  // Remove title case for 'feet'
  standardizedLocation = standardizedLocation.replace(/\bFeet\b/g, 'feet')

  return standardizedLocation
}

const stripReturnData = (obj, selectedFields) => {
  // Return only what we want.
  const fieldNames = Object.getOwnPropertyNames(obj)

  if (selectedFields && Object.keys(selectedFields).length > 0) {
    fieldNames.forEach((field) => {
      if (field in selectedFields) {
        if (obj[field] && Object.keys(selectedFields[field]).length > 0) {
          stripReturnData(obj[field], selectedFields[field])
        }
      } else {
        delete obj[field]
      }
    })
  }
  return obj
}

const connection = initializeConnection({
  host: "127.0.0.1",
  user: process.env.MYSQL_DATABASE_USER,
  password: process.env.MYSQL_DATABASE_PASSWORD,
  database: "traffic_violations",
  multipleStatements: true,
})

const server = http.createServer(async (req, res) => {
  // Set response headers
  res.setHeader("Content-Type", "application/json;charset=utf-8")
  res.setHeader("Access-Control-Allow-Origin", "*")

  const receivedAtDate = new Date()

  console.log("----------------------------------------------------")
  console.log(`request received at: ${receivedAtDate}`)
  console.log(`request url: ${req.url}`)
  console.log("\n\n")

  if (req.url.match("/webhook/twitter")) {
    if (req.method === "POST") {
      let body = []
      req
        .on("data", (chunk) => {
          body.push(chunk)
        })
        .on("end", () => {
          body = Buffer.concat(body).toString()
          // at this point, `body` has the entire request body stored in it as a string

          console.log("\n\n")
          console.log(body)
          console.log("\n\n")

          const hmac = createHmac("sha256", process.env.TWITTER_CONSUMER_SECRET)
          const expectedSHA = "sha256=" + hmac.update(body).digest("base64")

          if (req.headers["x-twitter-webhooks-signature"] === expectedSHA) {
            const json = JSON.parse(body)
            console.log("received event")
            console.log(json)

            if (json.block_events) {
              console.log("event type: block(s)")
              json.block_events.forEach((event) => {
                handleBlockEvent(event)
              })
            } else if (json.direct_message_events) {
              console.log("event type: direct message(s)")
              json.direct_message_events.forEach((event) => {
                handleDirectMessageEvent(event, json.users)
              })
            } else if (json.direct_message_indicate_typing_events) {
              console.log("event type: direct message indicate typing event(s)")
              json.direct_message_indicate_typing_events.forEach((event) => {
                handleDirectMessageIndicateTypingEvent(event)
              })
            } else if (json.direct_message_mark_read_events) {
              console.log("event type: direct message mark read event(s)")
              json.direct_message_mark_read_events.forEach((event) => {
                handleDirectMessageMarkReadEvent(event)
              })
            } else if (json.favorite_events) {
              console.log("event type: favorite(s)")
              json.favorite_events.forEach((event) => {
                handleFavoriteEvent(event)
              })
            } else if (json.follow_events) {
              console.log("event type: follow(s)")
              json.follow_events.forEach((event) => {
                handleFollowEvent(event)
              })
            } else if (json.mute_events) {
              console.log("event type: mute(s)")
              json.mute_events.forEach((event) => {
                handleMuteEvent(event)
              })
            } else if (json.tweet_create_events) {
              console.log("event type: tweet create event(s)")
              json.tweet_create_events.forEach((event) => {
                handleTweetCreateEvent(event)
              })
            } else if (json.tweet_delete_events) {
              console.log("event type: tweet delete event(s)")
              json.tweet_delete_events.forEach((event) => {
                handleTweetDeleteEvent(event)
              })
            } else if (json.unblock_events) {
              console.log("event type: unblock(s)")
              json.unblock_events.forEach((event) => {
                handleUnblockEvent(event)
              })
            } else if (json.unfollow_events) {
              console.log("event type: follow(s)")
              json.unfollow_events.forEach((event) => {
                handleUnfollowEvent(event)
              })
            } else if (json.unmute_events) {
              console.log("event type: unmute(s)")
              json.unmute_events.forEach((event) => {
                handleUnmuteEvent(event)
              })
            } else if (json.user_event) {
              console.log("events type: user(s)")
              handleUserEvent(json.user_event)
            } else {
              console.log("Not sure how to process the following payload: ")
              console.log(json)
            }
          }
        })
    } else if (req.method === "GET") {
      console.log("getting a challenge request")

      const host = req.headers.host
      const protocol = host === LOCAL_SERVER_LOCATION ? "http" : "https"
      const parser = new URL(req.url, `${protocol}://${host}`)
      const searchParams = parser.searchParams

      console.log(parser.searchParams)

      const crcToken = searchParams.get("crc_token") || ""
      console.log(crcToken)

      // creates HMAC SHA-256 hash from incomming token and your consumer secret
      // construct response data with base64 encoded hash
      const hmac = createHmac("sha256", process.env.TWITTER_CONSUMER_SECRET)

      const response = {
        response_token: `sha256=${hmac.update(crcToken).digest("base64")}`,
      }

      // # returns properly formatted json response
      res.writeHead(200)
      res.end(JSON.stringify(response))

      console.log(JSON.stringify(response))
    }
  } else if (req.url.match(EXISTING_LOOKUP_PATH)) {
    const host = req.headers.host
    const protocol = host === LOCAL_SERVER_LOCATION ? "http" : "https"
    const parser = new URL(req.url, `${protocol}://${host}`)

    const pathname = parser.pathname
    const regexString = `${EXISTING_LOOKUP_PATH}[/]*`
    const identifier = pathname.replace(new RegExp(regexString), "")
    const searchParams = parser.searchParams

    const fields = findFilterFields(searchParams.fields)

    if (!identifier) {
      const body = {
        error: "You must supply the identifier of a lookup, e.g. 'a1b2c3d4' ",
      }
      res.writeHead(400)
      res.end(JSON.stringify(body))

      return
    }

    getPreviousQueryResult(identifier).then((previousLookup) => {
      if (!previousLookup) {
        res.writeHead(200)
        res.end(JSON.stringify({ data: [] }))

        return
      }

      const potentialVehicle = [
        `${previousLookup.plate}:${previousLookup.state}${
          previousLookup.plate_types ? `:${previousLookup.plate_types}` : ""
        }`,
      ]

      const vehicles = detectVehicles(potentialVehicle)

      const externalData = {
        lookup_source: EXISTING_LOOKUP_SOURCE,
        fingerprint_id: null,
        mixpanel_id: null,
        unique_identifier: identifier,
        existing_lookup_created_at: previousLookup.created_at,
      }

      Promise.all(
        vehicles.map(
          async (vehicle) =>
            await getVehicleResponse(vehicle, fields, externalData)
        )
      ).then((allResponses) => {
        const body = { data: allResponses }
        const eTag = createHash('md5').update(JSON.stringify(body)).digest('hex')

        res.setHeader('ETag', `"${eTag}"`)
        res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate')

        if (req.headers['if-none-match'] === `"${eTag}"`) {
          res.writeHead(304)
          res.statusCode = 304

          return
        }

        res.writeHead(200)
        res.end(JSON.stringify(body))
      })
    })

    // TODO: Move external lookup sources to another url.
    //
    // const apiKey = query.api_key;
    //
    // if (apiKey == undefined) {
    //   res.writeHead(401);
    //   res.end(JSON.stringify({error: "You must supply an api key to perform a recorded lookup, e.g. '&api_key=xxx' "}));
    //
    //   return;
    //
    // } else {
    //   let _ = connection.query('select * from authorized_external_users where api_key = ?', [apiKey], (error, results, fields) => {
    //     if (error) throw error;
    //
    //     if (results.length == 0) {
    //       res.writeHead(403);
    //       res.end(JSON.stringify({error: "You supplied an invalid api key."}));
    //
    //       return;
    //     } else {
    //       lookupSource  = 'external'
    //     }
    //
    //   });
    // }
  } else if (req.url.match(API_LOOKUP_PATH)) {
    const host = req.headers.host
    const protocol = host === LOCAL_SERVER_LOCATION ? "http" : "https"
    const parser = new URL(req.url, `${protocol}://${host}`)
    const searchParams = parser.searchParams

    const fields = findFilterFields(searchParams.fields)

    const violationCodesAsArray = searchParams.getAll("violation_codes[]")
    const violationCodesAsCommaSeparatedList =
      searchParams.get("violation_codes")
    const violationCodeAsSingleValue = searchParams.getAll("violation_code")

    const potentialViolationCodes = violationCodesAsArray.length
      ? violationCodesAsArray
      : (violationCodesAsCommaSeparatedList
          ? violationCodesAsCommaSeparatedList.split(",")
          : null) || violationCodeAsSingleValue

    const plateFromQuery = searchParams.getAll("plate")
    const plateIdFromQuery = searchParams.get("plate_id")
    const plateTypesFromQuery = searchParams.get("plate_types")
    const stateFromQuery = searchParams.get("state")

    const fingerprintId = searchParams.get("fingerprint_id")
    const lookupSource = searchParams.get("lookup_source")
    const mixpanelId = searchParams.get("mixpanel_id")

    if (potentialViolationCodes.length) {
      const violationCodes = potentialViolationCodes.filter(
        (potentialViolationCode, index) =>
          // Is integer
          Number.isInteger(Number.parseInt(potentialViolationCode)) &&
          // Is not duplicate
          potentialViolationCodes.indexOf(potentialViolationCode) === index
      )

      const externalData = {
        lookup_source: lookupSource,
        fingerprint_id: fingerprintId,
        mixpanel_id: mixpanelId,
      }

      getViolationCodesResponse(violationCodes, fields, externalData)

      res.writeHead(200)
      res.end(JSON.stringify({ data: { violation_codes: violationCodes } }))
      return
    }

    let potentialVehicles

    if (!plateFromQuery) {
      potentialVehicles = []
    } else if (plateFromQuery instanceof Array) {
      potentialVehicles = plateFromQuery
    } else {
      potentialVehicles = [plateFromQuery]
    }

    if (plateIdFromQuery instanceof Array || stateFromQuery instanceof Array) {
      const errorObject = {
        error:
          "To look up multiple vehicles, use 'plate=<STATE>:<PLATE>', ex: 'api.howsmydrivingny.nyc/api/v1?plate=abc1234:ny'",
      }

      res.writeHead(422)
      res.end(JSON.stringify(errorObject))

      return
    }

    const plate = (plateIdFromQuery || "").toUpperCase()
    const state = (stateFromQuery || "").toUpperCase()
    const plateTypes = plateTypesFromQuery
      ? plateTypesFromQuery
          .split(",")
          .map((item) => item.toUpperCase().trim())
          .sort()
      : null

    const plateTypesString = plateTypes ? `:${plateTypes}` : ""

    if (plate && state) {
      potentialVehicles.push(`${plate}:${state}${plateTypesString}`)
    }

    const vehicles = detectVehicles(potentialVehicles)

    const externalData = {
      lookup_source: lookupSource,
      fingerprint_id: fingerprintId,
      mixpanel_id: mixpanelId,
    }

    Promise.all(
      vehicles.map((vehicle) =>
        getVehicleResponse(vehicle, fields, externalData)
      )
    ).then((allResponses) => {
      const body = { data: allResponses }
      const eTag = createHash('md5').update(JSON.stringify(body)).digest('hex')

      res.setHeader('ETag', `"${eTag}"`)
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate')

      if (req.headers['if-none-match'] === `"${eTag}"`) {
        res.statusCode = 304
        res.end()

        return
      }

      res.writeHead(200)
      res.end(JSON.stringify(body))
    })

    // res.end(JSON.stringify({error: "Missing either plate_id or state, both of which
    // are required, ex: 'api.howsmydrivingny.nyc/api/v1?plate_id=abc1234&state=ny'"}))
  } else {
    res.writeHead(404)
    res.end(JSON.stringify({ error: "not found" }))
  }
})

server.listen(SERVER_PORT)

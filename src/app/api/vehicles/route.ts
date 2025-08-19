import { NextResponse } from 'next/server';

const vehicleData = {
  "Abarth": ["124 Spider", "500", "500e", "595", "695", "Grande Punto", "Punto Evo"],
  "Alfa Romeo": ["4C", "147", "156", "159", "166", "Brera", "GT", "GTV", "Giulia", "Giulietta", "MiTo", "Spider", "Stelvio", "Tonale"],
  "Alpine": ["A110"],
  "Aston Martin": ["Cygnet", "DB7", "DB9", "DB11", "DB12", "DBS", "DBX", "Rapide", "Vanquish", "Vantage", "Virage"],
  "Audi": ["80", "100", "A1", "A2", "A3", "A4", "A5", "A6", "A6 Allroad", "A7", "A8", "Cabriolet", "Q2", "Q3", "Q4 e-tron", "Q5", "Q6 e-tron", "Q7", "Q8", "R8", "TT", "e-tron", "e-tron GT"],
  "Bentley": ["Arnage", "Azure", "Bentayga", "Brooklands", "Continental GT", "Flying Spur", "Mulsanne"],
  "BMW": ["1 Series", "2 Series", "3 Series", "4 Series", "5 Series", "6 Series", "7 Series", "8 Series", "i3", "i4", "i5", "i7", "i8", "iX", "iX1", "iX3", "X1", "X2", "X3", "X4", "X5", "X6", "X7", "XM", "Z1", "Z3", "Z4", "Z8"],
  "Bugatti": ["Chiron", "EB 110", "Veyron"],
  "BYD": ["Atto 3", "Dolphin", "Seal"],
  "Cadillac": ["BLS", "CTS", "Escalade", "SRX", "XT4", "XT5"],
  "Chevrolet": ["Aveo", "Camaro", "Captiva", "Corvette", "Cruze", "Kalos", "Lacetti", "Matiz", "Orlando", "Spark", "Volt"],
  "Chrysler": ["300C", "Crossfire", "Delta", "Grand Voyager", "Neon", "PT Cruiser", "Voyager", "Ypsilon"],
  "Citroen": ["AX", "Ami", "Berlingo", "C1", "C2", "C3", "C3 Aircross", "C3 Picasso", "C4", "C4 Cactus", "C4 Picasso", "C4 X", "C5", "C5 Aircross", "C5 X", "C6", "DS3", "DS4", "DS5", "Grand C4 Picasso", "Nemo", "Saxo", "Spacetourer", "Xantia", "XM", "Xsara", "Xsara Picasso", "ZX"],
  "Cupra": ["Ateca", "Born", "Formentor", "Leon", "Tavascan"],
  "Dacia": ["Duster", "Jogger", "Logan", "Logan MCV", "Sandero", "Sandero Stepway", "Spring"],
  "Daihatsu": ["Charade", "Copen", "Fourtrak", "Materia", "Sirion", "Terios"],
  "DS Automobiles": ["DS 3", "DS 3 Crossback", "DS 4", "DS 5", "DS 7 Crossback", "DS 9"],
  "Dodge": ["Avenger", "Caliber", "Challenger", "Charger", "Journey", "Nitro", "Viper"],
  "Ferrari": ["296 GTB", "360 Modena", "458 Italia", "488 GTB", "599 GTB Fiorano", "612 Scaglietti", "812 Superfast", "California", "Enzo", "F8 Tributo", "F12berlinetta", "F430", "FF", "GTC4Lusso", "LaFerrari", "Portofino", "Purosangue", "Roma", "SF90 Stradale"],
  "Fiat": ["124 Spider", "500", "500C", "500L", "500X", "500e", "Bravo", "Cinquecento", "Croma", "Doblo", "Grande Punto", "Multipla", "Panda", "Punto", "Punto Evo", "Qubo", "Sedici", "Seicento", "Stilo", "Tipo", "Uno"],
  "Ford": ["B-Max", "C-Max", "Capri", "Cortina", "Cougar", "EcoSport", "Edge", "Escort", "Explorer", "Fiesta", "Focus", "Fusion", "Galaxy", "Grand C-Max", "Granada", "Ka", "Ka+", "Kuga", "Mondeo", "Mustang", "Mustang Mach-E", "Probe", "Puma", "Ranger", "S-Max", "Sierra", "SportKa", "StreetKa", "Tourneo Connect", "Tourneo Custom"],
  "Genesis": ["G70", "G80", "G90", "GV60", "GV70", "GV80"],
  "Honda": ["Accord", "CR-V", "CR-Z", "CRX", "Civic", "FR-V", "HR-V", "Insight", "Integra", "Jazz", "Legend", "Prelude", "S2000", "e"],
  "Hyundai": ["Accent", "Atoz", "Bayon", "Coupe", "Getz", "Ioniq", "Ioniq 5", "Ioniq 6", "Kona", "Matrix", "Nexo", "Santa Fe", "Tucson", "Veloster", "i10", "i20", "i30", "i40", "i800", "ix20", "ix35"],
  "Ineos": ["Grenadier"],
  "Infiniti": ["FX", "G37", "Q30", "Q50", "Q60", "QX30", "QX50", "QX70"],
  "Jaguar": ["E-Pace", "F-Pace", "F-Type", "I-Pace", "S-Type", "X-Type", "XE", "XF", "XJ", "XJS", "XK"],
  "Jeep": ["Avenger", "Cherokee", "Commander", "Compass", "Grand Cherokee", "Patriot", "Renegade", "Wrangler"],
  "Kia": ["Carens", "Ceed", "Cerato", "EV6", "EV9", "Niro", "Optima", "Picanto", "Pride", "ProCeed", "Rio", "Sedona", "Sorento", "Soul", "Sportage", "Stinger", "Stonic", "Venga", "XCeed", "e-Niro"],
  "Lamborghini": ["Aventador", "Countach", "Diablo", "Gallardo", "Huracan", "Murcielago", "Revuelto", "Urus"],
  "Land Rover": ["Defender", "Discovery", "Discovery Sport", "Freelander", "Range Rover", "Range Rover Evoque", "Range Rover Sport", "Range Rover Velar"],
  "Lexus": ["CT", "ES", "GS", "IS", "LBX", "LC", "LFA", "LS", "NX", "RC", "RX", "RZ", "SC430", "UX"],
  "Lotus": ["Carlton", "Eletre", "Elise", "Emira", "Esprit", "Evija", "Evora", "Exige"],
  "Maserati": ["3200 GT", "4200 GT", "Ghibli", "GranCabrio", "GranTurismo", "Grecale", "Levante", "MC20", "Quattroporte"],
  "Mazda": ["2", "3", "323", "5", "6", "626", "CX-3", "CX-30", "CX-5", "CX-60", "CX-7", "MX-30", "MX-5", "RX-7", "RX-8"],
  "McLaren": ["570S", "650S", "720S", "750S", "Artura", "Elva", "F1", "GT", "MP4-12C", "P1", "Senna"],
  "Mercedes-Benz": ["A-Class", "AMG GT", "B-Class", "C-Class", "CL", "CLA", "CLK", "CLS", "E-Class", "EQA", "EQB", "EQC", "EQE", "EQS", "EQV", "G-Class", "GLA", "GLB", "GLC", "GLE", "GLK", "GLS", "M-Class", "R-Class", "S-Class", "SL", "SLC", "SLK", "SLS AMG", "V-Class", "X-Class"],
  "MG": ["3", "4 EV", "5 EV", "6", "F", "HS", "TF", "ZR", "ZS", "ZS EV", "ZT"],
  "MINI": ["Clubman", "Convertible", "Countryman", "Coupe", "Hatch", "Mini (Classic)", "Paceman", "Roadster"],
  "Mitsubishi": ["3000GT", "ASX", "Carisma", "Colt", "Eclipse Cross", "FTO", "Galant", "L200", "Lancer", "Lancer Evolution", "Mirage", "Outlander", "Shogun", "Shogun Sport", "Space Star"],
  "Nissan": ["200SX", "350Z", "370Z", "Almera", "Ariya", "Cube", "GT-R", "Juke", "Leaf", "Micra", "Murano", "NV200 Combi", "Navara", "Note", "Patrol", "Pixo", "Primera", "Pulsar", "Qashqai", "Skyline", "Sunny", "X-Trail"],
  "ORA": ["Funky Cat"],
  "Peugeot": ["1007", "106", "107", "108", "2008", "205", "206", "207", "208", "3008", "306", "307", "308", "309", "4007", "405", "406", "407", "408", "5008", "508", "607", "Partner Tepee", "RCZ", "Rifter", "Traveller"],
  "Polestar": ["1", "2", "3", "4"],
  "Porsche": ["718 Boxster", "718 Cayman", "911", "918 Spyder", "928", "944", "968", "Boxster", "Carrera GT", "Cayenne", "Cayman", "Macan", "Panamera", "Taycan"],
  "Renault": ["5", "19", "Arkana", "Austral", "Avantime", "Captur", "Clio", "Espace", "Grand Scenic", "Kadjar", "Kangoo", "Koleos", "Laguna", "Megane", "Modus", "Scenic", "Twingo", "Vel Satis", "Wind", "Zoe"],
  "Rimac": ["Nevera"],
  "Rivian": ["R1S", "R1T"],
  "Rolls-Royce": ["Cullinan", "Dawn", "Ghost", "Phantom", "Silver Seraph", "Spectre", "Wraith"],
  "Rover": ["25", "45", "75", "200 Series", "400 Series", "600 Series", "800 Series", "Maestro", "Metro", "Montego", "Streetwise"],
  "Saab": ["9-3", "9-5", "900", "9000"],
  "SEAT": ["Alhambra", "Altea", "Arona", "Arosa", "Ateca", "Cordoba", "Exeo", "Ibiza", "Leon", "Mii", "Tarraco", "Toledo"],
  "Skoda": ["Citigo", "Enyaq iV", "Fabia", "Felicia", "Kamiq", "Karoq", "Kodiaq", "Octavia", "Roomster", "Scala", "Superb", "Yeti"],
  "Smart": ["#1", "#3", "Forfour", "Fortwo", "Roadster"],
  "SsangYong": ["Korando", "Musso", "Rexton", "Rodius", "Tivoli"],
  "Subaru": ["BRZ", "Forester", "Impreza", "Legacy", "Levorg", "Outback", "WRX STI", "XV"],
  "Suzuki": ["Across", "Alto", "Baleno", "Celerio", "Grand Vitara", "Ignis", "Jimny", "Kizashi", "Liana", "S-Cross", "Splash", "Swace", "Swift", "SX4", "Vitara", "Wagon R+"],
  "Tesla": ["Cybertruck", "Model 3", "Model S", "Model X", "Model Y", "Roadster"],
  "Toyota": ["Auris", "Avensis", "Aygo", "Aygo X", "C-HR", "Celica", "Corolla", "GR Yaris", "GT86", "Highlander", "Hilux", "Land Cruiser", "MR2", "Mirai", "Previa", "Prius", "RAV4", "Starlet", "Supra", "Verso", "Yaris", "bZ4X", "iQ"],
  "Vauxhall": ["Adam", "Agila", "Ampera", "Astra", "Calibra", "Carlton", "Cascada", "Cavalier", "Combo Life", "Corsa", "Crossland", "Frontera", "Grandland", "Insignia", "Meriva", "Mokka", "Nova", "Omega", "Senator", "Signum", "Tigra", "VXR8", "Vectra", "Viva", "Zafira"],
  "Volkswagen": ["Amarok", "Arteon", "Beetle", "Bora", "CC", "Caddy", "Corrado", "Eos", "Fox", "Golf", "ID. Buzz", "ID.3", "ID.4", "ID.5", "ID.7", "Jetta", "Lupo", "Passat", "Phaeton", "Polo", "Scirocco", "Sharan", "T-Cross", "T-Roc", "Taigo", "Tiguan", "Tiguan Allspace", "Touareg", "Touran", "Up!"],
  "Volvo": ["480", "850", "940", "C30", "C40", "C70", "EX30", "EX90", "S40", "S60", "S90", "V40", "V50", "V60", "V70", "V90", "XC40", "XC60", "XC90"]
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const make = searchParams.get('make');

  if (make) {
    const models = vehicleData[make as keyof typeof vehicleData] || [];
    return NextResponse.json({ models });
  }

  const makes = Object.keys(vehicleData);
  return NextResponse.json({ makes });
}

    
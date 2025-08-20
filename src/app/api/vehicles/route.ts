import { NextResponse } from 'next/server';

const vehicleData = {
  "Abarth": ["595", "695", "124 Spider"],
  "Alfa Romeo": ["Giulia", "Stelvio", "Tonale", "Giulietta", "4C"],
  "Aston Martin": ["DB11", "DBS Superleggera", "Vantage", "DBX"],
  "Audi": ["A1", "A3", "A4", "A5", "A6", "A7", "A8", "Q2", "Q3", "Q4 e-tron", "Q5", "Q7", "Q8", "e-tron", "TT", "R8"],
  "Bentley": ["Bentayga", "Continental GT", "Flying Spur"],
  "BMW": ["1 Series", "2 Series", "3 Series", "4 Series", "5 Series", "6 Series", "7 Series", "8 Series", "X1", "X2", "X3", "X4", "X5", "X6", "X7", "Z4", "i3", "i4", "iX3", "iX"],
  "Bugatti": ["Chiron", "Divo", "Veyron"],
  "Cadillac": ["CT4", "CT5", "Escalade", "XT4", "XT5", "XT6"],
  "Chevrolet": ["Camaro", "Corvette", "Malibu", "Silverado", "Suburban", "Tahoe", "Traverse"],
  "Chrysler": ["300", "Pacifica", "Voyager"],
  "Citroën": ["C1", "C3", "C3 Aircross", "C4", "C5 Aircross", "C5 X", "Berlingo", "SpaceTourer"],
  "Cupra": ["Ateca", "Formentor", "Leon", "Born"],
  "Dacia": ["Sandero", "Sandero Stepway", "Duster", "Jogger", "Spring"],
  "Dodge": ["Challenger", "Charger", "Durango"],
  "DS Automobiles": ["DS 3 Crossback", "DS 4", "DS 7 Crossback", "DS 9"],
  "Ferrari": ["296 GTB", "812 Superfast", "F8 Tributo", "Portofino M", "Roma", "SF90 Stradale"],
  "Fiat": ["500", "500X", "Panda", "Tipo", "500e"],
  "Ford": ["Fiesta", "Focus", "Puma", "Kuga", "Mustang", "Mustang Mach-E", "Explorer", "Ranger"],
  "Genesis": ["G70", "G80", "G90", "GV70", "GV80"],
  "Honda": ["Jazz", "Civic", "HR-V", "CR-V", "Honda e"],
  "Hyundai": ["i10", "i20", "i30", "Bayon", "Kona", "Tucson", "Santa Fe", "Ioniq 5", "Ioniq 6"],
  "Infiniti": ["Q50", "Q60", "QX50", "QX55", "QX60", "QX80"],
  "Jaguar": ["XE", "XF", "F-PACE", "E-PACE", "I-PACE", "F-TYPE"],
  "Jeep": ["Renegade", "Compass", "Wrangler", "Grand Cherokee", "Avenger"],
  "Kia": ["Picanto", "Rio", "Ceed", "ProCeed", "XCeed", "Stonic", "Niro", "Sportage", "Sorento", "EV6", "Stinger"],
  "Lamborghini": ["Aventador", "Huracan", "Urus"],
  "Land Rover": ["Defender", "Discovery", "Discovery Sport", "Range Rover", "Range Rover Sport", "Range Rover Velar", "Range Rover Evoque"],
  "Lexus": ["IS", "ES", "LS", "NX", "RX", "UX", "LC", "RC"],
  "Lotus": ["Elise", "Evora", "Exige", "Emira"],
  "Maserati": ["Ghibli", "Levante", "MC20", "Quattroporte", "Grecale"],
  "Mazda": ["Mazda2", "Mazda3", "CX-30", "CX-5", "CX-60", "MX-5"],
  "McLaren": ["570S", "600LT", "720S", "GT", "Artura"],
  "Mercedes-Benz": ["A-Class", "C-Class", "E-Class", "S-Class", "CLA", "CLS", "GLA", "GLB", "GLC", "GLE", "GLS", "EQA", "EQB", "EQC", "EQE", "EQS", "SL", "AMG GT"],
  "MG": ["MG3", "MG5 EV", "ZS", "HS", "Marvel R"],
  "MINI": ["Hatch", "Convertible", "Clubman", "Countryman", "Electric"],
  "Mitsubishi": ["Mirage", "ASX", "Eclipse Cross", "Outlander"],
  "Nissan": ["Micra", "Juke", "Qashqai", "X-Trail", "Leaf", "Ariya", "GT-R"],
  "Peugeot": ["208", "2008", "308", "3008", "508", "5008", "Rifter"],
  "Polestar": ["Polestar 1", "Polestar 2", "Polestar 3"],
  "Porsche": ["718 Cayman", "718 Boxster", "911", "Panamera", "Macan", "Cayenne", "Taycan"],
  "Renault": ["Clio", "Captur", "Megane", "Arkana", "Austral", "Zoe"],
  "Rolls-Royce": ["Phantom", "Ghost", "Cullinan", "Wraith", "Dawn"],
  "SEAT": ["Ibiza", "Leon", "Arona", "Ateca", "Tarraco"],
  "Škoda": ["Fabia", "Scala", "Octavia", "Superb", "Kamiq", "Karoq", "Kodiaq", "Enyaq iV"],
  "Smart": ["EQ fortwo", "EQ forfour"],
  "SsangYong": ["Tivoli", "Korando", "Rexton", "Musso"],
  "Subaru": ["Impreza", "XV", "Forester", "Outback", "BRZ"],
  "Suzuki": ["Ignis", "Swift", "Vitara", "S-Cross", "Across", "Swace"],
  "Tesla": ["Model 3", "Model S", "Model X", "Model Y"],
  "Toyota": ["Aygo X", "Yaris", "Yaris Cross", "Corolla", "C-HR", "RAV4", "Highlander", "Land Cruiser", "Mirai", "GR Supra", "GR Yaris", "bZ4X"],
  "Vauxhall": ["Corsa", "Astra", "Mokka", "Crossland", "Grandland"],
  "Volkswagen": ["Polo", "Golf", "Taigo", "T-Cross", "T-Roc", "Tiguan", "Touareg", "Passat", "Arteon", "ID.3", "ID.4", "ID.5", "ID.Buzz"],
  "Volvo": ["S60", "S90", "V60", "V90", "XC40", "XC60", "XC90", "C40"]
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const make = searchParams.get('make');

  if (make) {
    const models = (vehicleData as any)[make] || [];
    return NextResponse.json({ models });
  }

  const makes = Object.keys(vehicleData);
  return NextResponse.json({ makes });
}
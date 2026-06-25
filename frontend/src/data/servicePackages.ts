export interface ServicePackage {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'basic' | 'premium' | 'deluxe' | 'specialty';
  /** @deprecated UI uses category styling instead of emoji */
  icon?: string;
}

export const servicePackages: ServicePackage[] = [
  {
    id: '1',
    name: 'Full Basic Wash',
    description: 'Complete exterior wash including body, windows, and wheels. Perfect for regular maintenance.',
    price: 50,
    category: 'basic',
  },
  {
    id: '2',
    name: 'Engine Wash',
    description: 'Deep cleaning of engine bay, removing dirt, grime, and oil buildup. Protects engine components.',
    price: 80,
    category: 'specialty',
  },
  {
    id: '3',
    name: 'Exterior Wash',
    description: 'Comprehensive exterior cleaning including body wash, tire shine, and window cleaning.',
    price: 40,
    category: 'basic',
  },
  {
    id: '4',
    name: 'Interior Wash',
    description: 'Thorough interior cleaning including vacuuming, dashboard polish, and seat cleaning.',
    price: 60,
    category: 'basic',
  },
  {
    id: '5',
    name: 'Wax and Polishing',
    description: 'Premium wax application and paint polishing for a showroom shine and long-lasting protection.',
    price: 100,
    category: 'premium',
  },
  {
    id: '6',
    name: 'Complete Detail Package',
    description: 'Full service including interior, exterior, engine wash, wax, and polishing. The ultimate car care experience.',
    price: 200,
    category: 'deluxe',
  },
  {
    id: '7',
    name: 'Quick Express Wash',
    description: 'Fast exterior wash for busy customers. Body and windows only. Perfect for quick touch-ups.',
    price: 25,
    category: 'basic',
  },
  {
    id: '8',
    name: 'Ceramic Coating',
    description: 'Advanced ceramic coating application for superior paint protection and hydrophobic properties.',
    price: 300,
    category: 'deluxe',
  },
  {
    id: '9',
    name: 'Leather Conditioning',
    description: 'Professional leather seat cleaning, conditioning, and protection to maintain premium feel.',
    price: 75,
    category: 'premium',
  },
  {
    id: '10',
    name: 'Headlight Restoration',
    description: 'Restore cloudy or yellowed headlights to like-new condition, improving visibility and appearance.',
    price: 90,
    category: 'specialty',
  },
  {
    id: '11',
    name: 'Undercarriage Wash',
    description: 'Thorough cleaning of vehicle undercarriage to remove road salt, mud, and prevent rust.',
    price: 65,
    category: 'specialty',
  },
  {
    id: '12',
    name: 'Paint Correction',
    description: 'Professional paint correction to remove swirls, scratches, and restore original paint finish.',
    price: 250,
    category: 'deluxe',
  },
];

export const getPackageById = (id: string): ServicePackage | undefined => {
  return servicePackages.find(pkg => pkg.id === id);
};

export const getPackagesByCategory = (category: ServicePackage['category']): ServicePackage[] => {
  return servicePackages.filter(pkg => pkg.category === category);
};

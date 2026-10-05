// Kopi Koffee - Full Menu Data faithfully extracted from physical menu
// Organized into clean Main Groups & Subcategories

const MAIN_GROUPS = [
    { 
        id: "categories", 
        name: "Toutes les Catégories", 
        icon: "grid" 
    },
    { 
        id: "petit-dejeuner", 
        name: "Petit Déjeuner & Brunch", 
        icon: "breakfast",
        desc: "Formules complètes, viennoiseries dorées, œufs & délices matinaux",
        image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80",
        badge: "7 formules"
    },
    { 
        id: "cafes-chauds-groupe", 
        name: "Cafés & Boissons Chaudes", 
        icon: "coffee",
        desc: "Espressos d'exception, cafés frappés & glacés, thés fins & chocolat chaud",
        image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80",
        badge: "32 délices"
    },
    { 
        id: "jus-boissons", 
        name: "Jus & Boissons Fraîches", 
        icon: "drink",
        desc: "Jus d'oranges pressés à la minute, cocktails vitaminés, thés glacés & sodas",
        image: "https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=800&q=80",
        badge: "24 boissons"
    },
    { 
        id: "shakes-mojitos", 
        name: "Smoothies, Shakes & Mojitos", 
        icon: "cocktail",
        desc: "Milkshakes onctueux, smoothies 100% fruits, mojitos rafraîchissants",
        image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=800&q=80",
        badge: "21 créations"
    },
    { 
        id: "crepes-gaufres", 
        name: "Crêpes, Gaufres & Pancakes", 
        icon: "dessert",
        desc: "Crêpes salées gourmandes, crêpes sucrées, gaufres liégeoises & pancakes",
        image: "https://images.unsplash.com/photo-1519676867240-f03562e64548?auto=format&fit=crop&w=800&q=80",
        badge: "20 spécialités"
    },
    { 
        id: "sale-restauration", 
        name: "Salé & Restauration", 
        icon: "snack",
        desc: "Paninis croustillants, burgers gourmets au bœuf ou poulet, omelettes maison",
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
        badge: "13 plats"
    },
    { 
        id: "desserts-glaces", 
        name: "Desserts & Glaces", 
        icon: "dessert",
        desc: "Pâtisseries artisanales, cheesecakes, moelleux & coupes glacées parfumées",
        image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80",
        badge: "7 douceurs"
    },
    { 
        id: "chicha-groupe", 
        name: "Espace Chicha", 
        icon: "lounge",
        desc: "Chicha classique et chicha fraîcheur au glaçon, parfums variés",
        image: "https://images.unsplash.com/photo-1542385151-efd9000785a0?auto=format&fit=crop&w=800&q=80",
        badge: "Lounge"
    }
];

const MENU_CATEGORIES = [
    { id: "all", name: "Tout", groupId: "all", icon: "sparkle" },
    
    // Petit Déjeuner
    { id: "petit-dejeuner", name: "Formules Petit Déjeuner", groupId: "petit-dejeuner", icon: "breakfast" },
    
    // Cafés & Boissons Chaudes
    { id: "cafes-chauds", name: "Cafés Chauds", groupId: "cafes-chauds-groupe", icon: "coffee" },
    { id: "cafes-frappes", name: "Cafés Frappés", groupId: "cafes-chauds-groupe", icon: "coffee" },
    { id: "cafes-glaces", name: "Cafés Glacés", groupId: "cafes-chauds-groupe", icon: "drink" },
    { id: "thes", name: "Thés & Infusions", groupId: "cafes-chauds-groupe", icon: "tea" },
    { id: "chocolat-chaud", name: "Chocolat Chaud", groupId: "cafes-chauds-groupe", icon: "cup" },

    // Jus & Boissons Fraîches
    { id: "jus", name: "Jus Frais Pressés", groupId: "jus-boissons", icon: "drink" },
    { id: "cocktails", name: "Cocktails de Fruits", groupId: "jus-boissons", icon: "cocktail" },
    { id: "thes-glaces", name: "Thés Glacés", groupId: "jus-boissons", icon: "tea" },
    { id: "boissons", name: "Eaux & Sodas", groupId: "jus-boissons", icon: "drink" },

    // Smoothies, Shakes & Mojitos
    { id: "smoothies", name: "Smoothies Pur Fruit", groupId: "shakes-mojitos", icon: "drink" },
    { id: "milkshakes", name: "Milk-shakes Gourmands", groupId: "shakes-mojitos", icon: "dessert" },
    { id: "mojitos", name: "Mojitos Frais", groupId: "shakes-mojitos", icon: "cocktail" },
    { id: "soft-cocktails", name: "Soft Cocktails", groupId: "shakes-mojitos", icon: "cocktail" },

    // Crêpes & Gaufres
    { id: "crepes-salees", name: "Crêpes Salées", groupId: "crepes-gaufres", icon: "dessert" },
    { id: "crepes-sucrees", name: "Crêpes Sucrées", groupId: "crepes-gaufres", icon: "dessert" },
    { id: "gaufres", name: "Gaufres Liégeoises", groupId: "crepes-gaufres", icon: "dessert" },
    { id: "pancakes", name: "Pancakes Américains", groupId: "crepes-gaufres", icon: "dessert" },

    // Salé & Restauration
    { id: "paninis", name: "Paninis Croustillants", groupId: "sale-restauration", icon: "snack" },
    { id: "hamburgers", name: "Burgers Gourmets", groupId: "sale-restauration", icon: "snack" },
    { id: "omelettes", name: "Omelettes Maison", groupId: "sale-restauration", icon: "breakfast" },

    // Desserts
    { id: "desserts", name: "Pâtisseries & Glaces", groupId: "desserts-glaces", icon: "dessert" },

    // Chicha
    { id: "chicha", name: "Chicha & Chicha Glaçon", groupId: "chicha-groupe", icon: "lounge" }
];

const MENU_ITEMS = [
    // --- PETIT DÉJEUNER ---
    {
        id: "pd-1",
        categoryId: "petit-dejeuner",
        groupId: "petit-dejeuner",
        name: "Fast",
        price: 7,
        badge: "Formule Matin",
        description: "Café au choix, Jus frais, Eau 0.5L, Croissant chaud ou Cake moelleux.",
        image: "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "pd-2",
        categoryId: "petit-dejeuner",
        groupId: "petit-dejeuner",
        name: "Big Ben",
        price: 13,
        badge: "Populaire",
        description: "Café, Jus, Eau 0.5L, Croissant ou Cake, Pain de mie grillé, œuf à la coque, Beurre, Confiture, Chocolat, Yaourt, Chamia.",
        image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "pd-3",
        categoryId: "petit-dejeuner",
        groupId: "petit-dejeuner",
        name: "Healthy",
        price: 15,
        badge: "Équilibré",
        description: "Café ou Thé infusion, Bol de Granola croquant, Jus, Eau 0.5L, Fruits frais de saison, Yaourt, Jambon, Toast Pain Complet.",
        image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "pd-4",
        categoryId: "petit-dejeuner",
        groupId: "petit-dejeuner",
        name: "Just Eat (1 Personne)",
        price: 18,
        description: "Café, Jus, Eau 0.5L, Croissant ou Cake, Pain de mie, Beurre, Confiture, Yaourt, Chocolat, Chamia, mini Crêpes ou Omelette.",
        image: "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "pd-5",
        categoryId: "petit-dejeuner",
        groupId: "petit-dejeuner",
        name: "Just Eat (2 Personnes)",
        price: 30,
        badge: "Duo Gourmand",
        description: "Formule complète pour 2 : Cafés, Jus, Eaux, assortiment viennoiseries, tartines, œufs ou crêpes, confitures et douceurs.",
        image: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "pd-6",
        categoryId: "petit-dejeuner",
        groupId: "petit-dejeuner",
        name: "Tunisien (1 Personne)",
        price: 18,
        badge: "Authentique",
        description: "Café, Jus, Eau 1L, Mlewi chaud, Bsisa parfumée, Chamia, Yaourt, Miel pur, Huile d'olive extra-vierge, Ojja maison, Plat charcuterie ou Omelette.",
        image: "https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "pd-7",
        categoryId: "petit-dejeuner",
        groupId: "petit-dejeuner",
        name: "Tunisien (2 Personnes)",
        price: 30,
        badge: "Festin Tunisien",
        description: "Festin tunisien pour 2 : Mlewi croustillant, Ojja savoureuse, Bsisa, Chamia, Miel, Huile d'olive, Yaourt, Omelette ou charcuterie, boissons.",
        image: "https://images.unsplash.com/photo-1588137378633-dea1336ce1e2?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "pd-8",
        categoryId: "petit-dejeuner",
        groupId: "petit-dejeuner",
        name: "Kopi Brunch (2 Personnes)",
        price: 37,
        badge: "Spécialité Kopi",
        description: "Le grand festin Kopi : Café, Jus, Eau 1L, Assortiment de viennoiseries, Pain de mie, Pancake moelleux, Salade de fruits, Beurre, Confiture, Chocolat, Yaourt, Céréales, Salade composée, Assiette de Charcuteries, Olives, Œuf à la coque, Omelette ou Crêpe.",
        image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=600&q=80"
    },

    // --- CAFÉS CHAUDS ---
    {
        id: "cc-1",
        categoryId: "cafes-chauds",
        groupId: "cafes-chauds-groupe",
        name: "Espresso",
        price: 3,
        description: "Espresso intense torréfié à la perfection avec sa belle crema dorée.",
        image: "https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "cc-2",
        categoryId: "cafes-chauds",
        groupId: "cafes-chauds-groupe",
        name: "Double Espresso",
        price: 4.5,
        description: "Double dose de café d'exception pour un réveil énergique.",
        image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "cc-3",
        categoryId: "cafes-chauds",
        groupId: "cafes-chauds-groupe",
        name: "Américain",
        price: 3.5,
        description: "Café allongé délicat aux arômes subtils et équilibrés.",
        image: "https://images.unsplash.com/photo-1509785307050-d4066910ec1e?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "cc-4",
        categoryId: "cafes-chauds",
        groupId: "cafes-chauds-groupe",
        name: "Macchiato",
        price: 3.5,
        description: "Espresso riche surmonté d'une larme de mousse de lait veloutée.",
        image: "https://images.unsplash.com/photo-1485808191679-5f86510681a2?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "cc-5",
        categoryId: "cafes-chauds",
        groupId: "cafes-chauds-groupe",
        name: "Café Latte",
        price: 4,
        description: "Alliance onctueuse d'un espresso serré et d'un grand volume de lait chaud micro-moussé.",
        image: "https://images.unsplash.com/photo-1561047029-3000c68339ca?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "cc-6",
        categoryId: "cafes-chauds",
        groupId: "cafes-chauds-groupe",
        name: "Cappuccino",
        price: 5,
        badge: "Incontournable",
        description: "Espresso surmonté d'une épaisse couche de mousse de lait crémeuse avec saupoudrage cacao.",
        image: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "cc-7",
        categoryId: "cafes-chauds",
        groupId: "cafes-chauds-groupe",
        name: "Cappuccino Special",
        price: 6.5,
        badge: "Gourmand",
        description: "Recette signature Kopi généreuse, chantilly aérienne et coulis au choix.",
        image: "https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "cc-8",
        categoryId: "cafes-chauds",
        groupId: "cafes-chauds-groupe",
        name: "Chocolat au Lait",
        price: 4.5,
        description: "Chocolat chaud réconfortant au lait entier crémeux.",
        image: "https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "cc-9",
        categoryId: "cafes-chauds",
        groupId: "cafes-chauds-groupe",
        name: "Mocha",
        price: 5,
        description: "Harmonie parfaite d'espresso corsé, chocolat onctueux et lait mousseux.",
        image: "https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "cc-10",
        categoryId: "cafes-chauds",
        groupId: "cafes-chauds-groupe",
        name: "Café Turc",
        price: 6,
        description: "Préparé selon la méthode traditionnelle, riche et envoûtant.",
        image: "https://images.unsplash.com/photo-1579888944880-d98341245702?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "cc-11",
        categoryId: "cafes-chauds",
        groupId: "cafes-chauds-groupe",
        name: "Lavazza Capsule",
        price: 7,
        description: "Sélection premium capsule Lavazza haute intensité aromatique.",
        image: "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "cc-12",
        categoryId: "cafes-chauds",
        groupId: "cafes-chauds-groupe",
        name: "Supplément Arôme",
        price: 1.5,
        description: "Personnalisez votre café : Sirop Vanille, Caramel beurre salé, Noisette grillée ou Chocolat.",
        image: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=600&q=80"
    },

    // --- CAFÉS FRAPPÉS ---
    {
        id: "cf-1",
        categoryId: "cafes-frappes",
        groupId: "cafes-chauds-groupe",
        name: "Frappé Classique",
        price: 7,
        description: "Café frappé rafraîchissant mixé à la glace pilée et lait mousseux.",
        image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "cf-2",
        categoryId: "cafes-frappes",
        groupId: "cafes-chauds-groupe",
        name: "Frappé Caramel",
        price: 7,
        badge: "Favori",
        description: "Glace pilée, café onctueux et tourbillon de sauce caramel doré.",
        image: "https://images.unsplash.com/photo-1577805947697-89e18249d767?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "cf-3",
        categoryId: "cafes-frappes",
        groupId: "cafes-chauds-groupe",
        name: "Frappé Noisette",
        price: 7,
        description: "Délicieuse saveur noisette torréfiée associée à un café glacé gourmand.",
        image: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "cf-4",
        categoryId: "cafes-frappes",
        groupId: "cafes-chauds-groupe",
        name: "Frappé Chocolate",
        price: 7,
        description: "Le mariage gourmand du café frappé et du coulis de chocolat pur.",
        image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "cf-5",
        categoryId: "cafes-frappes",
        groupId: "cafes-chauds-groupe",
        name: "Frappé Mocha",
        price: 9,
        description: "Café glacé onctueux, riche touche de cacao et crème fouettée.",
        image: "https://images.unsplash.com/photo-1592318837499-2b8765324978?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "cf-6",
        categoryId: "cafes-frappes",
        groupId: "cafes-chauds-groupe",
        name: "Frappé Nutella",
        price: 9,
        badge: "Ultra Gourmand",
        description: "Frappé crémeux au véritable Nutella, crème et pépites de chocolat.",
        image: "https://images.unsplash.com/photo-1589396575653-c09c794ff6a6?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "cf-7",
        categoryId: "cafes-frappes",
        groupId: "cafes-chauds-groupe",
        name: "Frappé Oreo",
        price: 10,
        description: "Éclats croustillants de biscuits Oreo mixés dans un café glacé soyeux.",
        image: "https://images.unsplash.com/photo-1541658016709-82535e94bc69?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "cf-8",
        categoryId: "cafes-frappes",
        groupId: "cafes-chauds-groupe",
        name: "Frappé Snickers",
        price: 10,
        badge: "Spécialité Kopi",
        description: "Frappé gourmand aux éclats de Snickers, caramel fondant et cacahuètes.",
        image: "https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?auto=format&fit=crop&w=600&q=80"
    },

    // --- CAFÉS GLACÉS ---
    {
        id: "cg-1",
        categoryId: "cafes-glaces",
        groupId: "cafes-chauds-groupe",
        name: "Iced Americano",
        price: 6,
        description: "Double espresso coulé sur un lit de glaçons pour un rafraîchissement pur.",
        image: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "cg-2",
        categoryId: "cafes-glaces",
        groupId: "cafes-chauds-groupe",
        name: "American Latte Aromatisé",
        price: 8,
        description: "Latte glacé onctueux parfumé à votre arôme préféré servi très frais.",
        image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "cg-3",
        categoryId: "cafes-glaces",
        groupId: "cafes-chauds-groupe",
        name: "Iced Caramel Macchiato",
        price: 10,
        badge: "Best-seller",
        description: "Lait vanillé frais avec glaçons, surmonté d'espresso corsé et quadrillage de caramel.",
        image: "https://images.unsplash.com/photo-1577805947697-89e18249d767?auto=format&fit=crop&w=600&q=80"
    },

    // --- THÉS & INFUSIONS ---
    {
        id: "th-1",
        categoryId: "thes",
        groupId: "cafes-chauds-groupe",
        name: "Thé Marocain",
        price: 3,
        description: "Thé vert traditionnel infusé aux feuilles de menthe fraîche et sucré.",
        image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "th-2",
        categoryId: "thes",
        groupId: "cafes-chauds-groupe",
        name: "Thé Infusion",
        price: 5,
        description: "Sélection d'herbes aromatiques apaisantes et digestives.",
        image: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "th-3",
        categoryId: "thes",
        groupId: "cafes-chauds-groupe",
        name: "Thé Orange Cannelle",
        price: 6,
        badge: "Parfumé",
        description: "Saveurs d'agrumes relevées d'une pointe d'écorce de cannelle chaleureuse.",
        image: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "th-4",
        categoryId: "thes",
        groupId: "cafes-chauds-groupe",
        name: "Thé aux Amandes",
        price: 7,
        badge: "Tradition Tunisienne",
        description: "Thé à la menthe servi généreusement garni d'amandes grillées croquantes.",
        image: "https://images.unsplash.com/photo-1594631252845-29fc4cc8cde9?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "th-5",
        categoryId: "thes",
        groupId: "cafes-chauds-groupe",
        name: "Thé aux Pignons",
        price: 9,
        badge: "Prestige",
        description: "Le grand classique tunisien orné de véritables pignons de pin dorés.",
        image: "https://images.unsplash.com/photo-1563822249548-9a72b6353cd1?auto=format&fit=crop&w=600&q=80"
    },

    // --- THÉS GLACÉS ---
    {
        id: "tg-1",
        categoryId: "thes-glaces",
        groupId: "jus-boissons",
        name: "Thé Glacé Simple",
        price: 5,
        description: "Thé noir glacé désaltérant avec tranche de citron frais.",
        image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "tg-2",
        categoryId: "thes-glaces",
        groupId: "jus-boissons",
        name: "Thé Glacé Amour",
        price: 7,
        badge: "Maison",
        description: "Mélange fruité floral doux et envoûtant servi très frais.",
        image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "tg-3",
        categoryId: "thes-glaces",
        groupId: "jus-boissons",
        name: "Thé Glacé Fruit de la Passion",
        price: 7,
        badge: "Exotique",
        description: "Notes acidulées et parfumées de maracuja tropical.",
        image: "https://images.unsplash.com/photo-1499638673689-79a0b5115d87?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "tg-4",
        categoryId: "thes-glaces",
        groupId: "jus-boissons",
        name: "Thé Glacé Black Berry",
        price: 7,
        description: "Saveur intense de mûres sauvages et baies noires bien fraîches.",
        image: "https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "tg-5",
        categoryId: "thes-glaces",
        groupId: "jus-boissons",
        name: "Thé Glacé Pina Colada",
        price: 7,
        description: "Cocktail glacé de thé aux arômes gourmands d'ananas et de noix de coco.",
        image: "https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=600&q=80"
    },

    // --- CHOCOLAT CHAUD ---
    {
        id: "ch-1",
        categoryId: "chocolat-chaud",
        groupId: "cafes-chauds-groupe",
        name: "Chocolat Chaud Classique",
        price: 6,
        description: "Chocolat noir fondu onctueux préparé à l'ancienne.",
        image: "https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "ch-2",
        categoryId: "chocolat-chaud",
        groupId: "cafes-chauds-groupe",
        name: "Chocolat Chaud Blanc",
        price: 6,
        description: "Chocolat blanc crémeux aux notes gourmandes de vanille de Madagascar.",
        image: "https://images.unsplash.com/photo-1517578239113-b03992dcdd25?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "ch-3",
        categoryId: "chocolat-chaud",
        groupId: "cafes-chauds-groupe",
        name: "Chocolat Chaud Aromatisé",
        price: 7,
        description: "Chocolat riche relevé d'arôme caramel, noisette ou cannelle.",
        image: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "ch-4",
        categoryId: "chocolat-chaud",
        groupId: "cafes-chauds-groupe",
        name: "Chocolat Chaud Amande",
        price: 7.5,
        badge: "Gourmand",
        description: "Chocolat chaud épais garni d'amandes effilées croquantes.",
        image: "https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?auto=format&fit=crop&w=600&q=80"
    },

    // --- JUS FRAIS ---
    {
        id: "jus-1",
        categoryId: "jus",
        groupId: "jus-boissons",
        name: "Jus d'Orange Pressé",
        price: 6,
        description: "Oranges gorgées de soleil pressées à la minute devant vous.",
        image: "https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "jus-2",
        categoryId: "jus",
        groupId: "jus-boissons",
        name: "Citronnade Maison",
        price: 6,
        badge: "Rafraîchissant",
        description: "Citronnade tunisienne artisanale pure et désaltérante.",
        image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "jus-3",
        categoryId: "jus",
        groupId: "jus-boissons",
        name: "Jus de Kiwi",
        price: 7,
        description: "Kiwis frais mixés riches en vitamine C et saveur acidulée.",
        image: "https://images.unsplash.com/photo-1589733955941-5eeaf752f6dd?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "jus-4",
        categoryId: "jus",
        groupId: "jus-boissons",
        name: "Jus de Fraise",
        price: 7,
        description: "Fraises fraîches mixées au goût sucré et délicat.",
        image: "https://images.unsplash.com/photo-1525385133512-2f3bdd039054?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "jus-5",
        categoryId: "jus",
        groupId: "jus-boissons",
        name: "Jus de Pêche",
        price: 7,
        description: "Nectar velouté de pêches mûres et parfumées.",
        image: "https://images.unsplash.com/photo-1536935338788-846bb9981813?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "jus-6",
        categoryId: "jus",
        groupId: "jus-boissons",
        name: "Citronnade à la Menthe",
        price: 7.5,
        badge: "Best-seller",
        description: "Citrons frais mixés avec de la menthe fraîche parfumée.",
        image: "https://images.unsplash.com/photo-1523677011781-c91d1bbe2f9e?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "jus-7",
        categoryId: "jus",
        groupId: "jus-boissons",
        name: "Jus d'Ananas",
        price: 8,
        description: "Ananas frais pressé gorgé de soleil tropical.",
        image: "https://images.unsplash.com/photo-1589733955941-5eeaf752f6dd?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "jus-8",
        categoryId: "jus",
        groupId: "jus-boissons",
        name: "Citronnade aux Amandes",
        price: 8,
        badge: "Spécialité Kopi",
        description: "Citronnade onctueuse mélangée à de la purée d'amandes douces.",
        image: "https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "jus-9",
        categoryId: "jus",
        groupId: "jus-boissons",
        name: "Jus Fruits Rouges",
        price: 10,
        badge: "Cocktail Vitaminé",
        description: "Mélange explosif de framboises, myrtilles, mûres et fraises.",
        image: "https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=600&q=80"
    },

    // --- COCKTAILS FRUITS ---
    {
        id: "ckt-1",
        categoryId: "cocktails",
        groupId: "jus-boissons",
        name: "Fraise Citron",
        price: 8,
        description: "Alliance pétillante de fraises sucrées et jus de citron acidulé.",
        image: "https://images.unsplash.com/photo-1525385133512-2f3bdd039054?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "ckt-2",
        categoryId: "cocktails",
        groupId: "jus-boissons",
        name: "Lait de Poule",
        price: 8,
        badge: "Onctueux",
        description: "Recette traditionnelle au lait velouté, touche d'épices douces.",
        image: "https://images.unsplash.com/photo-1577805947697-89e18249d767?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "ckt-3",
        categoryId: "cocktails",
        groupId: "jus-boissons",
        name: "Ananas Banane",
        price: 8,
        description: "Duo tropical velouté doux et nutritif.",
        image: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "ckt-4",
        categoryId: "cocktails",
        groupId: "jus-boissons",
        name: "Banane Datte",
        price: 8,
        badge: "Énergie",
        description: "Mix énergétique de bananes mûres et dattes Deglet Nour de Tunisie.",
        image: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "ckt-5",
        categoryId: "cocktails",
        groupId: "jus-boissons",
        name: "Fraise Banane",
        price: 8,
        description: "Le grand classique indémodable onctueux et fruité.",
        image: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "ckt-6",
        categoryId: "cocktails",
        groupId: "jus-boissons",
        name: "Kiwi Banane",
        price: 8,
        description: "Équilibre parfait entre l'acidulé du kiwi et la douceur de la banane.",
        image: "https://images.unsplash.com/photo-1589733955941-5eeaf752f6dd?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "ckt-7",
        categoryId: "cocktails",
        groupId: "jus-boissons",
        name: "Banane Pomme",
        price: 8,
        description: "Mélange doux et léger de pommes fraîches et bananes.",
        image: "https://images.unsplash.com/photo-1570857502809-08184874388e?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "ckt-8",
        categoryId: "cocktails",
        groupId: "jus-boissons",
        name: "Pêche Banane",
        price: 8,
        description: "Texture soyeuse aux saveurs d'été pêche et banane.",
        image: "https://images.unsplash.com/photo-1536935338788-846bb9981813?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "ckt-9",
        categoryId: "cocktails",
        groupId: "jus-boissons",
        name: "Orange Banane",
        price: 8,
        description: "Jus d'orange frais vitaminé mixé à la banane mûre.",
        image: "https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "ckt-10",
        categoryId: "cocktails",
        groupId: "jus-boissons",
        name: "Cocktail Kopi Signature",
        price: 14,
        badge: "Chef d'œuvre",
        description: "Le cocktail d'exception Kopi : Banane, pomme fraîche, datte du sud, pistache croquante et amande torréfiée.",
        image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80"
    },

    // --- MILK-SHAKES ---
    {
        id: "ms-1",
        categoryId: "milkshakes",
        groupId: "shakes-mojitos",
        name: "Milk-shake Nutella",
        price: 9,
        badge: "Star",
        description: "Glace vanille, lait frais et généreuse cuillère de Nutella fondant.",
        image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "ms-2",
        categoryId: "milkshakes",
        groupId: "shakes-mojitos",
        name: "Milk-shake Oreo",
        price: 9,
        description: "Biscuits Oreo écrasés, glace crémeuse et chantilly maison.",
        image: "https://images.unsplash.com/photo-1541658016709-82535e94bc69?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "ms-3",
        categoryId: "milkshakes",
        groupId: "shakes-mojitos",
        name: "Milk-shake Spéculos",
        price: 9,
        description: "Saveur authentique Lotus Spéculos et crème glacée douce.",
        image: "https://images.unsplash.com/photo-1579954115545-a95591f28bfc?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "ms-4",
        categoryId: "milkshakes",
        groupId: "shakes-mojitos",
        name: "Milk-shake Snickers",
        price: 10,
        description: "Cacahuètes grillées, chocolat, coulis caramel et morceaux de Snickers.",
        image: "https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "ms-5",
        categoryId: "milkshakes",
        groupId: "shakes-mojitos",
        name: "Milk-shake Ferrero",
        price: 12,
        badge: "Prestige",
        description: "Chocolat praliné, éclats de noisettes et rocher Ferrero en garniture.",
        image: "https://images.unsplash.com/photo-1589396575653-c09c794ff6a6?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "ms-6",
        categoryId: "milkshakes",
        groupId: "shakes-mojitos",
        name: "Milk-shake Kinder",
        price: 12,
        badge: "Gourmandise",
        description: "Crème au chocolat blanc et chocolat au lait façon barre Kinder Bueno.",
        image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=600&q=80"
    },

    // --- SMOOTHIES ---
    {
        id: "sm-1",
        categoryId: "smoothies",
        groupId: "shakes-mojitos",
        name: "Smoothie Pina Colada",
        price: 9,
        badge: "Saveur des Îles",
        description: "Ananas frais et crème de noix de coco mixés avec glace pilée.",
        image: "https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "sm-2",
        categoryId: "smoothies",
        groupId: "shakes-mojitos",
        name: "Smoothie Manga",
        price: 9,
        description: "Mangue mûre tropicale veloutée et savoureuse.",
        image: "https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "sm-3",
        categoryId: "smoothies",
        groupId: "shakes-mojitos",
        name: "Smoothie Kiwi",
        price: 9,
        description: "Fraîcheur intense de kiwi vert juteux.",
        image: "https://images.unsplash.com/photo-1589733955941-5eeaf752f6dd?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "sm-4",
        categoryId: "smoothies",
        groupId: "shakes-mojitos",
        name: "Smoothie Fruit de Passion",
        price: 9,
        badge: "Intense",
        description: "Saveur maracuja envoûtante et acidulée.",
        image: "https://images.unsplash.com/photo-1499638673689-79a0b5115d87?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "sm-5",
        categoryId: "smoothies",
        groupId: "shakes-mojitos",
        name: "Smoothie Black Berry",
        price: 9,
        description: "Mûres sauvages et fruits noirs gorgés d'antioxydants.",
        image: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "sm-6",
        categoryId: "smoothies",
        groupId: "shakes-mojitos",
        name: "Smoothie Fruit Rouge",
        price: 9,
        badge: "Best-seller",
        description: "Délice de fraises, framboises et mûres mixées fraîches.",
        image: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "sm-7",
        categoryId: "smoothies",
        groupId: "shakes-mojitos",
        name: "Smoothie Pineapple",
        price: 9,
        description: "Purée d'ananas frais très fraîche et désaltérante.",
        image: "https://images.unsplash.com/photo-1589733955941-5eeaf752f6dd?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "sm-8",
        categoryId: "smoothies",
        groupId: "shakes-mojitos",
        name: "Smoothie Pêche",
        price: 9,
        description: "Pêches de vigne veloutées et rafraîchissantes.",
        image: "https://images.unsplash.com/photo-1536935338788-846bb9981813?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "sm-9",
        categoryId: "smoothies",
        groupId: "shakes-mojitos",
        name: "Smoothie Exotique",
        price: 9,
        badge: "Tropical",
        description: "Mix détonnant de mangue, passion, ananas et goyave.",
        image: "https://images.unsplash.com/photo-1505252585461-04db1eb84625?auto=format&fit=crop&w=600&q=80"
    },

    // --- MOJITOS & MOCKTAILS ---
    {
        id: "moj-1",
        categoryId: "mojitos",
        groupId: "shakes-mojitos",
        name: "Mojito Virgin",
        price: 7,
        badge: "Classique",
        description: "Citron vert pilé, menthe fraîche, sucre de canne et eau gazeuse fraîche.",
        image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "moj-2",
        categoryId: "mojitos",
        groupId: "shakes-mojitos",
        name: "Mojito Mexicain",
        price: 8,
        description: "Touche épicée et citronnée aux herbes fraîches.",
        image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "moj-3",
        categoryId: "mojitos",
        groupId: "shakes-mojitos",
        name: "Mojito Red",
        price: 8,
        description: "Mojito rafraîchissant sublimé par des fruits rouges et fraises pilées.",
        image: "https://images.unsplash.com/photo-1525385133512-2f3bdd039054?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "moj-4",
        categoryId: "mojitos",
        groupId: "shakes-mojitos",
        name: "Mojito Bleu Curaçao",
        price: 8,
        badge: "Lagon Bleu",
        description: "Couleur turquoise éclatante, notes d'agrumes et menthe fraîche.",
        image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "moj-5",
        categoryId: "mojitos",
        groupId: "shakes-mojitos",
        name: "Mojito Kiwi",
        price: 9,
        description: "Éclats de kiwi vert frais pilés avec menthe et glace pilée.",
        image: "https://images.unsplash.com/photo-1589733955941-5eeaf752f6dd?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "moj-6",
        categoryId: "mojitos",
        groupId: "shakes-mojitos",
        name: "Mojito Pêche",
        price: 9,
        description: "Saveur douce de pêche estivale mariée à la menthe citronnée.",
        image: "https://images.unsplash.com/photo-1536935338788-846bb9981813?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "moj-7",
        categoryId: "mojitos",
        groupId: "shakes-mojitos",
        name: "Mojito Pomme",
        price: 9,
        description: "Pomme verte croquante acidulée et menthe aromatique.",
        image: "https://images.unsplash.com/photo-1570857502809-08184874388e?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "moj-8",
        categoryId: "mojitos",
        groupId: "shakes-mojitos",
        name: "Mojito Black",
        price: 10,
        badge: "Mystère Kopi",
        description: "Saveurs intenses de baies noires et mystérieuse touche Kopi.",
        image: "https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "moj-9",
        categoryId: "mojitos",
        groupId: "shakes-mojitos",
        name: "Mojito Candy",
        price: 11,
        description: "Douceur bonbon acidulée pour les amateurs de sucré.",
        image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "moj-10",
        categoryId: "mojitos",
        groupId: "shakes-mojitos",
        name: "Mojito Paradox",
        price: 11,
        description: "Jeu de saveurs contrastées doux-amer et agrumes frais.",
        image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "moj-11",
        categoryId: "mojitos",
        groupId: "shakes-mojitos",
        name: "Mojito Énergétique",
        price: 12,
        badge: "Boost",
        description: "Mojito frais revigorant associé à une boisson énergisante.",
        image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80"
    },

    // --- SOFT COCKTAILS ---
    {
        id: "sc-1",
        categoryId: "soft-cocktails",
        groupId: "shakes-mojitos",
        name: "Cocktail Candy",
        price: 7,
        description: "Cocktail sans alcool rose poudré doux et fruité.",
        image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "sc-2",
        categoryId: "soft-cocktails",
        groupId: "shakes-mojitos",
        name: "Cocktail Rosa Negra",
        price: 7,
        description: "Mélange raffiné de fruits rouges et sirop de rose parfumé.",
        image: "https://images.unsplash.com/photo-1525385133512-2f3bdd039054?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "sc-3",
        categoryId: "soft-cocktails",
        groupId: "shakes-mojitos",
        name: "Pina Colada Soft",
        price: 7,
        badge: "Coco & Ananas",
        description: "Crème de noix de coco onctueuse et jus d'ananas frais.",
        image: "https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "sc-4",
        categoryId: "soft-cocktails",
        groupId: "shakes-mojitos",
        name: "Cocktail Tropical",
        price: 7,
        description: "Évasion sous les tropiques aux notes de mangue et passion.",
        image: "https://images.unsplash.com/photo-1505252585461-04db1eb84625?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "sc-5",
        categoryId: "soft-cocktails",
        groupId: "shakes-mojitos",
        name: "Cocktail Sunset",
        price: 7,
        badge: "Couché de Soleil",
        description: "Magnifique dégradé grenadine, orange et fruits tropicaux.",
        image: "https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=80"
    },

    // --- BOISSONS & SODAS ---
    {
        id: "boi-1",
        categoryId: "boissons",
        groupId: "jus-boissons",
        name: "Eau Minérale 0.5L",
        price: 2,
        description: "Bouteille d'eau minérale plate fraîche 50cl.",
        image: "https://images.unsplash.com/photo-1559839914-17aae19cec71?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "boi-2",
        categoryId: "boissons",
        groupId: "jus-boissons",
        name: "Eau Minérale 1L",
        price: 3,
        description: "Bouteille d'eau minérale plate fraîche 1 Litre.",
        image: "https://images.unsplash.com/photo-1559839914-17aae19cec71?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "boi-3",
        categoryId: "boissons",
        groupId: "jus-boissons",
        name: "Soda (Canette)",
        price: 3.5,
        description: "Coca-Cola, Fanta, Boga Cidre, Boga Lim, Sprite (selon disponibilité).",
        image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "boi-4",
        categoryId: "boissons",
        groupId: "jus-boissons",
        name: "Soda Spécial",
        price: 4,
        description: "Schweppes Tonic, Agrumes ou soda aromatisé premium.",
        image: "https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "boi-5",
        categoryId: "boissons",
        groupId: "jus-boissons",
        name: "Boisson Énergétique",
        price: 9,
        badge: "Red Bull / Shark",
        description: "Boisson énergisante fraîche pour un coup de fouet immédiat.",
        image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80"
    },

    // --- CRÊPES SALÉES ---
    {
        id: "cs-1",
        categoryId: "crepes-salees",
        groupId: "crepes-gaufres",
        name: "Crêpe Fromage",
        price: 7,
        description: "Crêpe salée dorée généreusement garnie de fromage fondu filant.",
        image: "https://images.unsplash.com/photo-1519676867240-f03562e64548?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "cs-2",
        categoryId: "crepes-salees",
        groupId: "crepes-gaufres",
        name: "Crêpe Fromage, Thon",
        price: 9,
        description: "Fromage fondant et thon égoutté de premier choix.",
        image: "https://images.unsplash.com/photo-1519676867240-f03562e64548?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "cs-3",
        categoryId: "crepes-salees",
        groupId: "crepes-gaufres",
        name: "Crêpe Fromage, Jambon",
        price: 9,
        description: "Classique savoureuse au jambon de dinde fumé et fromage fondant.",
        image: "https://images.unsplash.com/photo-1519676867240-f03562e64548?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "cs-4",
        categoryId: "crepes-salees",
        groupId: "crepes-gaufres",
        name: "Crêpe Fromage, Jambon, Thon",
        price: 10,
        description: "La combinaison complète jambon savoureux, thon et fromage fondu.",
        image: "https://images.unsplash.com/photo-1519676867240-f03562e64548?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "cs-5",
        categoryId: "crepes-salees",
        groupId: "crepes-gaufres",
        name: "Crêpe Fromage, Thon, Œuf",
        price: 10,
        badge: "Populaire",
        description: "Garniture gourmande thon, fromage et œuf cuit à point.",
        image: "https://images.unsplash.com/photo-1519676867240-f03562e64548?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "cs-6",
        categoryId: "crepes-salees",
        groupId: "crepes-gaufres",
        name: "Crêpe Quatre Fromages",
        price: 12,
        badge: "Fromagère",
        description: "Mélange royal : Mozzarella filante, Gruyère savoureux, Majesty et Cheddar fondant.",
        image: "https://images.unsplash.com/photo-1519676867240-f03562e64548?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "cs-7",
        categoryId: "crepes-salees",
        groupId: "crepes-gaufres",
        name: "Crêpe Pepperoni Kopi",
        price: 15,
        badge: "Spécialité Kopi",
        description: "Recette signature épicée : Spicy Pepperoni, Fromage abondant, œuf coulant et Jambon.",
        image: "https://images.unsplash.com/photo-1519676867240-f03562e64548?auto=format&fit=crop&w=600&q=80"
    },

    // --- CRÊPES SUCRÉES ---
    {
        id: "csu-1",
        categoryId: "crepes-sucrees",
        groupId: "crepes-gaufres",
        name: "Crêpe Chocolat",
        price: 7,
        description: "Nappage de chocolat fondant tiède sur crêpe fraîchement préparée.",
        image: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "csu-2",
        categoryId: "crepes-sucrees",
        groupId: "crepes-gaufres",
        name: "Crêpe Chocolat Banane",
        price: 8,
        description: "Tranches de bananes fraîches enrobées de chocolat soyeux.",
        image: "https://images.unsplash.com/photo-1519676867240-f03562e64548?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "csu-3",
        categoryId: "crepes-sucrees",
        groupId: "crepes-gaufres",
        name: "Crêpe Chocolat Fruits Secs",
        price: 9,
        description: "Chocolat velouté et cascade d'amandes, noisettes et pistaches croquantes.",
        image: "https://images.unsplash.com/photo-1506084868230-bb9d95c24759?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "csu-4",
        categoryId: "crepes-sucrees",
        groupId: "crepes-gaufres",
        name: "Crêpe Nutella",
        price: 9,
        badge: "Incontournable",
        description: "Généreuse couche de véritable pâte à tartiner Nutella.",
        image: "https://images.unsplash.com/photo-1519676867240-f03562e64548?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "csu-5",
        categoryId: "crepes-sucrees",
        groupId: "crepes-gaufres",
        name: "Crêpe Chocolat Banane, Fruits Secs",
        price: 12,
        description: "Bananes mûres, sauce chocolat et fruits secs torréfiés.",
        image: "https://images.unsplash.com/photo-1506084868230-bb9d95c24759?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "csu-6",
        categoryId: "crepes-sucrees",
        groupId: "crepes-gaufres",
        name: "Crêpe Nutella Banane",
        price: 12,
        badge: "Best-seller",
        description: "L'accord parfait : Nutella fondant et rondelles de banane.",
        image: "https://images.unsplash.com/photo-1519676867240-f03562e64548?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "csu-7",
        categoryId: "crepes-sucrees",
        groupId: "crepes-gaufres",
        name: "Crêpe Nutella Oreo",
        price: 12,
        description: "Nutella et brisures croustillantes de biscuits Oreo.",
        image: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "csu-8",
        categoryId: "crepes-sucrees",
        groupId: "crepes-gaufres",
        name: "Crêpe Spéculos",
        price: 12,
        description: "Pâte de Spéculos Lotus fondante et biscuits caramélisés.",
        image: "https://images.unsplash.com/photo-1506084868230-bb9d95c24759?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "csu-9",
        categoryId: "crepes-sucrees",
        groupId: "crepes-gaufres",
        name: "Crêpe Kinder",
        price: 14,
        badge: "Ultra Gourmande",
        description: "Chocolat au lait et barres Kinder fondantes réparties sur la crêpe.",
        image: "https://images.unsplash.com/photo-1519676867240-f03562e64548?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "csu-10",
        categoryId: "crepes-sucrees",
        groupId: "crepes-gaufres",
        name: "Crêpe Nutella Banane, Fruits Secs",
        price: 15,
        badge: "Gourmandise Absolue",
        description: "Nutella crémeux, tranches de bananes et mélange de fruits secs luxueux.",
        image: "https://images.unsplash.com/photo-1506084868230-bb9d95c24759?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "csu-11",
        categoryId: "crepes-sucrees",
        groupId: "crepes-gaufres",
        name: "Crêpe Raffael",
        price: 15,
        description: "Chocolat blanc, crème coco et véritables chocolats Raffaello.",
        image: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "csu-12",
        categoryId: "crepes-sucrees",
        groupId: "crepes-gaufres",
        name: "Crêpe Ferrero",
        price: 15,
        badge: "Prestige Kopi",
        description: "Chocolat praliné, noisettes concassées et rochers Ferrero Rocher.",
        image: "https://images.unsplash.com/photo-1519676867240-f03562e64548?auto=format&fit=crop&w=600&q=80"
    },

    // --- GAUFRES GOURMANDES ---
    {
        id: "gf-1",
        categoryId: "gaufres",
        groupId: "crepes-gaufres",
        name: "Gaufre Chocolat",
        price: 7,
        description: "Gaufre liégeoise croustillante à l'extérieur et moelleuse à cœur.",
        image: "https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "gf-2",
        categoryId: "gaufres",
        groupId: "crepes-gaufres",
        name: "Gaufre Chocolat Fruits Secs",
        price: 8,
        description: "Chocolat chaud onctueux et parsemé de fruits secs.",
        image: "https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "gf-3",
        categoryId: "gaufres",
        groupId: "crepes-gaufres",
        name: "Gaufre Chocolat Banane",
        price: 8,
        description: "Banane fruitée et généreux filet de chocolat.",
        image: "https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "gf-4",
        categoryId: "gaufres",
        groupId: "crepes-gaufres",
        name: "Gaufre Nutella",
        price: 9,
        badge: "Populaire",
        description: "Gaufre dorée recouverte de Nutella fondant à souhait.",
        image: "https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "gf-5",
        categoryId: "gaufres",
        groupId: "crepes-gaufres",
        name: "Gaufre Chocolat Banane, Fruits Secs",
        price: 10,
        description: "Tranches de bananes, chocolat et pluie de noisettes et pistaches.",
        image: "https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "gf-6",
        categoryId: "gaufres",
        groupId: "crepes-gaufres",
        name: "Gaufre Nutella Banane",
        price: 11,
        description: "Alliance star du Nutella et des rondelles de bananes.",
        image: "https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "gf-7",
        categoryId: "gaufres",
        groupId: "crepes-gaufres",
        name: "Gaufre Nutella Banane, Fruits Secs",
        price: 12,
        badge: "Gourmande",
        description: "Nutella, banane douce et assortiment de fruits secs.",
        image: "https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "gf-8",
        categoryId: "gaufres",
        groupId: "crepes-gaufres",
        name: "Gaufre Nutella Oreo",
        price: 12,
        description: "Nutella crémeux et morceaux croustillants d'Oreo.",
        image: "https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "gf-9",
        categoryId: "gaufres",
        groupId: "crepes-gaufres",
        name: "Gaufre Spéculos",
        price: 12,
        description: "Crème Spéculos Lotus fondante et miettes de spéculos.",
        image: "https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "gf-10",
        categoryId: "gaufres",
        groupId: "crepes-gaufres",
        name: "Gaufre Kinder",
        price: 12,
        badge: "Délicieuse",
        description: "Chocolat au lait et barres de chocolat Kinder Bueno fondues.",
        image: "https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "gf-11",
        categoryId: "gaufres",
        groupId: "crepes-gaufres",
        name: "Gaufre Raffael",
        price: 15,
        description: "Crème noix de coco, coulis blanc et billes Raffaello.",
        image: "https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "gf-12",
        categoryId: "gaufres",
        groupId: "crepes-gaufres",
        name: "Gaufre Ferrero",
        price: 15,
        badge: "Signature",
        description: "Gaufre royale au chocolat praliné, noisettes et Ferrero Rocher.",
        image: "https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=600&q=80"
    },

    // --- PANCAKES ---
    {
        id: "pc-1",
        categoryId: "pancakes",
        groupId: "crepes-gaufres",
        name: "Pancake au Miel",
        price: 7,
        description: "Pile de pancakes moelleux arrosés de miel d'abeilles doré.",
        image: "https://images.unsplash.com/photo-1528207776546-365bb710ee93?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "pc-2",
        categoryId: "pancakes",
        groupId: "crepes-gaufres",
        name: "Pancake Nutella",
        price: 9,
        badge: "Favori",
        description: "Pancakes aériens américains nappés de Nutella chaud.",
        image: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "pc-3",
        categoryId: "pancakes",
        groupId: "crepes-gaufres",
        name: "Pancake Nutella Fruits Secs",
        price: 12,
        badge: "Gourmand",
        description: "Pancakes épais au Nutella, parsemés d'amandes, noisettes et pistaches.",
        image: "https://images.unsplash.com/photo-1506084868230-bb9d95c24759?auto=format&fit=crop&w=600&q=80"
    },

    // --- PANINIS ---
    {
        id: "pan-1",
        categoryId: "paninis",
        groupId: "sale-restauration",
        name: "Panini Fromage, Jambon",
        price: 7.5,
        description: "Pain croustillant pressé à chaud, jambon de dinde et fromage fondant.",
        image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "pan-2",
        categoryId: "paninis",
        groupId: "sale-restauration",
        name: "Panini Thon Fromage",
        price: 8.5,
        description: "Thon mariné, fromage filant et sauce onctueuse.",
        image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "pan-3",
        categoryId: "paninis",
        groupId: "sale-restauration",
        name: "Panini Thon, Fromage, Jambon",
        price: 10,
        badge: "Complet",
        description: "Garniture généreuse thon, tranches de jambon et fromage fondu.",
        image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "pan-4",
        categoryId: "paninis",
        groupId: "sale-restauration",
        name: "Panini Poulet Fromage",
        price: 10,
        badge: "Best-seller",
        description: "Émincé de poulet tendre assaisonné et fromage fondant.",
        image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80"
    },

    // --- HAMBURGERS ---
    {
        id: "hb-1",
        categoryId: "hamburgers",
        groupId: "sale-restauration",
        name: "Cheeseburger",
        price: 10,
        description: "Steak haché grillé, cheddar fondu, salade croquante, tomate et sauce burger.",
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "hb-2",
        categoryId: "hamburgers",
        groupId: "sale-restauration",
        name: "Big Burger",
        price: 12.5,
        badge: "Spécialité Kopi",
        description: "Double steak savoureux, double cheddar, œuf, salade fraîche et sauce spéciale.",
        image: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=600&q=80"
    },

    // --- OMELETTES ---
    {
        id: "om-1",
        categoryId: "omelettes",
        groupId: "sale-restauration",
        name: "Omelette Fromage",
        price: 6,
        description: "Œufs battus baveux cuisinés avec du fromage fondant.",
        image: "https://images.unsplash.com/photo-1510693206972-df098062cb71?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "om-2",
        categoryId: "omelettes",
        groupId: "sale-restauration",
        name: "Omelette Thon, Fromage",
        price: 8,
        description: "Omelette dorée garnie de thon émietté et fromage filant.",
        image: "https://images.unsplash.com/photo-1510693206972-df098062cb71?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "om-3",
        categoryId: "omelettes",
        groupId: "sale-restauration",
        name: "Omelette Fromage, Jambon",
        price: 8,
        description: "Omelette savoureuse au jambon de dinde et fromage fondant.",
        image: "https://images.unsplash.com/photo-1510693206972-df098062cb71?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "om-4",
        categoryId: "omelettes",
        groupId: "sale-restauration",
        name: "Omelette Thon, Fromage, Jambon",
        price: 10,
        badge: "Complète",
        description: "La totale : thon, jambon fumé et fromage fondu à cœur.",
        image: "https://images.unsplash.com/photo-1510693206972-df098062cb71?auto=format&fit=crop&w=600&q=80"
    },

    // --- DESSERTS & GLACES ---
    {
        id: "des-1",
        categoryId: "desserts",
        groupId: "desserts-glaces",
        name: "Croissant au Beurre",
        price: 2,
        description: "Croissant pur beurre doré, feuilleté et croustillant.",
        image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "des-2",
        categoryId: "desserts",
        groupId: "desserts-glaces",
        name: "Cake Moelleux",
        price: 2.5,
        description: "Tranche de cake maison savoureuse (chocolat ou marbré).",
        image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "des-3",
        categoryId: "desserts",
        groupId: "desserts-glaces",
        name: "Gâteau Maison",
        price: 9,
        description: "Part généreuse de pâtisserie fraîche du jour.",
        image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "des-4",
        categoryId: "desserts",
        groupId: "desserts-glaces",
        name: "Fondant au Chocolat",
        price: 9,
        badge: "Cœur Coulant",
        description: "Gâteau chocolat tiède au cœur ultra coulant et fondant.",
        image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "des-5",
        categoryId: "desserts",
        groupId: "desserts-glaces",
        name: "Cheese Cake",
        price: 10,
        badge: "Délice New-Yorkais",
        description: "Cheesecake onctueux sur biscuit croquant, coulis de fruits rouges.",
        image: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "des-6",
        categoryId: "desserts",
        groupId: "desserts-glaces",
        name: "Tiramisu",
        price: 10,
        badge: "Tradition Italienne",
        description: "Véritable mascarpone onctueux, biscuits imbibés au café espresso et cacao.",
        image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "des-7",
        categoryId: "desserts",
        groupId: "desserts-glaces",
        name: "Glace 3 Boules",
        price: 7,
        description: "3 parfums au choix avec chantilly et coulis au choix.",
        image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "des-8",
        categoryId: "desserts",
        groupId: "desserts-glaces",
        name: "Glace 5 Boules",
        price: 10,
        badge: "Coupe Royale",
        description: "5 boules de crème glacée artisanale, chantilly généreuse et toppings.",
        image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "des-9",
        categoryId: "desserts",
        groupId: "desserts-glaces",
        name: "Glace Kopi",
        price: 12,
        badge: "Spécialité Kopi",
        description: "Coupe signature Kopi avec glaces sélectionnées, fruits secs, chantilly et coulis chocolat noisette.",
        image: "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "des-10",
        categoryId: "desserts",
        groupId: "desserts-glaces",
        name: "Assiette de Fruits",
        price: 12,
        badge: "Fraîcheur",
        description: "Belle composition de fruits frais de saison coupés et présentés avec soin.",
        image: "https://images.unsplash.com/photo-1519996529931-28324d5a630e?auto=format&fit=crop&w=600&q=80"
    },

    // --- CHICHA ---
    {
        id: "ch-f",
        categoryId: "chicha",
        groupId: "chicha-groupe",
        name: "Chicha Fakher",
        price: 9,
        description: "Tabac Al Fakher de qualité supérieure (Pomme, Menthe, Raisin, Myrtille...).",
        image: "https://images.unsplash.com/photo-1542385151-efd9000785a0?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "ch-g",
        categoryId: "chicha",
        groupId: "chicha-groupe",
        name: "Chicha Glaçon",
        price: 15,
        badge: "Fumée Glacée",
        description: "Chicha avec embout ou vase glaçon pour une sensation de fraîcheur intense.",
        image: "https://images.unsplash.com/photo-1542385151-efd9000785a0?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "ch-g2",
        categoryId: "chicha",
        groupId: "chicha-groupe",
        name: "Chicha Glacée (2 Personnes)",
        price: 17,
        badge: "Duo Lounge",
        description: "Formule chicha glacée longue durée à partager avec double tuyau.",
        image: "https://images.unsplash.com/photo-1542385151-efd9000785a0?auto=format&fit=crop&w=600&q=80"
    },
    {
        id: "ch-j",
        categoryId: "chicha",
        groupId: "chicha-groupe",
        name: "Jabed Jetable",
        price: 2.5,
        description: "Embout tuyau hygiénique jetable individuel scellé.",
        image: "https://images.unsplash.com/photo-1542385151-efd9000785a0?auto=format&fit=crop&w=600&q=80"
    }
];

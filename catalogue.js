/* =====================================================
   catalogue.js — LA CAMEROUNAISE BY LANDRY
   SOURCE UNIQUE de tous les plats du restaurant.
   Inclure AVANT menu.js, commande.js, reservation.js
   sur toutes les pages qui en ont besoin.
===================================================== */

window.CATALOGUE = [
  {
    id: 1,
    nom: "Ndolé",
    desc: "Feuilles amères, arachides, poisson fumé ou viande. Le plat national du Cameroun.",
    prix: 3500,
    cat: "principaux",
    badges: ["popular"],
    img: "images/ndolesoins.jpg"
  },
  {
    id: 2,
    nom: "Eru & Water Fufu",
    desc: "Feuilles de forêt cuites avec viande, crevettes séchées et fufu de manioc.",
    prix: 3000,
    cat: "principaux",
    badges: ["spicy"],
    img: "images/eru3 (1).jpg"
  },
  {
    id: 3,
    nom: "Jollof Camerounais",
    desc: "Riz parfumé cuit dans une sauce tomate épicée avec viande et légumes.",
    prix: 2500,
    cat: "principaux",
    badges: ["popular", "spicy"],
    img: "images/taro (2).jpg"
  },
  {
    id: 4,
    nom: "Poulet DG",
    desc: "Poulet sauté aux légumes frais et plantains dorés, façon « Directeur Général ».",
    prix: 3500,
    cat: "principaux",
    badges: ["popular"],
    img: "images/Poulet-DG-683x1024.webp"
  },
  {
    id: 5,
    nom: "Koki",
    desc: "Haricots cuits à la vapeur avec viande, bananes plantains et épices de saison.",
    prix: 2500,
    cat: "principaux",
    badges: [],
    img: "images/Mbongo-Tchobi.jpg"
  },
  {
    id: 6,
    nom: "Poisson Braisé",
    desc: "Poisson grillé au feu de bois, accompagné d'attiéké ou de plantain.",
    prix: 4000,
    cat: "principaux",
    badges: ["new", "spicy"],
    img: "images/ndolesoins.jpg"
  },
  {
    id: 7,
    nom: "Plantain Frit",
    desc: "Tranches de plantain mûr frites à l'huile, dorées et caramélisées.",
    prix: 800,
    cat: "accompagnements",
    badges: ["vegetarian"],
    img: "images/Beignets.gif"
  },
  {
    id: 8,
    nom: "Miondo (Bâtons de manioc)",
    desc: "Bâtons de manioc fermenté emballés dans des feuilles de bananier.",
    prix: 500,
    cat: "accompagnements",
    badges: ["vegetarian"],
    img: "images/Beignets.gif"
  },
  {
    id: 9,
    nom: "Soupe de Légumes",
    desc: "Bouillon chaud aux légumes frais de saison, légèrement épicé.",
    prix: 1200,
    cat: "soupes",
    badges: ["vegetarian", "new"],
    img: "images/taro (2).jpg"
  },
  {
    id: 10,
    nom: "Pepper Soup",
    desc: "Soupe épicée à la viande ou au poisson, aux épices africaines traditionnelles.",
    prix: 2000,
    cat: "soupes",
    badges: ["spicy"],
    img: "images/Mbongo-Tchobi.jpg"
  },
  {
    id: 11,
    nom: "Jus de Gingembre & Citron",
    desc: "Jus frais maison au gingembre, citron vert et sucre de canne.",
    prix: 700,
    cat: "boissons",
    badges: ["drink"],
    img: "images/taro (2).jpg"
  },
  {
    id: 12,
    nom: "Crêpes Maison",
    desc: "Crêpes faites maison, servies avec miel, confiture ou fruits rouges.",
    prix: 1000,
    cat: "desserts",
    badges: ["sweet", "new"],
    img: "images/Beignets.gif"
  }
];

/* Accès rapide par id */
window.CATALOGUE_BY_ID = {};
window.CATALOGUE.forEach(p => { window.CATALOGUE_BY_ID[p.id] = p; });
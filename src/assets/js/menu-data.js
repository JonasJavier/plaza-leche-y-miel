/*
 * Carta de Plaza Leche y Miel. Este es el ÚNICO archivo que se edita para
 * cambiar platos y precios.
 *
 * Fuente: la pizarra del local (foto en TripAdvisor) y su Instagram.
 * La pizarra no tiene precios: cuando el negocio los confirme, agrega
 * price: 250 (en RD$) a cada plato y el sitio los muestra solo, incluido
 * el total del pedido. Para tamaños: sizes: [["Normal", 250], ["Grande", 400]].
 *
 * Campos de cada plato:
 *   id        identificador único (sin espacios)
 *   name      nombre en español        en: nombre en inglés
 *   desc      descripción (opcional)   desc_en: en inglés
 *   tags      "popular" | "nuevo" | "casa" | "sin-gluten" | "saludable"
 *   photo     nombre de la foto en assets/img (opcional)
 *   fav       true = aparece en "Favoritos de la casa" del inicio
 */
window.MENU = {
  tags: {
    "popular": { es: "Favorito", en: "Favorite" },
    "nuevo": { es: "Nuevo", en: "New" },
    "casa": { es: "De la casa", en: "House special" },
    "sin-gluten": { es: "Sin gluten", en: "Gluten-free" },
    "saludable": { es: "Saludable", en: "Healthy" }
  },
  categories: [
    {
      id: "desayunos", name: "Desayunos", en: "Breakfast",
      note: "Desde las 8:00 a. m.", note_en: "From 8:00 a.m.",
      items: [
        { id: "mangu", name: "Mangú", en: "Mangú", desc: "Mangú de plátano con cebolla sofrita, 2 huevos (fritos o revueltos) y bacon.", desc_en: "Mashed plantain with sautéed onions, 2 eggs (fried or scrambled) and bacon.", tags: ["popular"], photo: "mangu", fav: true },
        { id: "pancakes", name: "Pancakes", en: "Pancakes", desc: "2 pancakes con sirope de maple, salchichas de desayuno y 2 huevos.", desc_en: "2 pancakes with maple syrup, breakfast sausages and 2 eggs." },
        { id: "omelette", name: "Omelette", en: "Omelette", desc: "Relleno de vegetales, jamón y queso, con 3 tostadas, mantequilla y mermelada.", desc_en: "Filled with vegetables, ham and cheese, with 3 toasts, butter and jelly." },
        { id: "pan-huevos-bacon", name: "Pan, huevos y bacon", en: "Bread, eggs & bacon", desc: "2 huevos (fritos o revueltos) y 3 tostadas con mantequilla y mermelada.", desc_en: "2 eggs (fried or scrambled) and 3 toasts with butter and jelly." },
        { id: "granola-waffles", name: "Granola, yogur y waffles", en: "Granola, yogurt & waffles", desc: "Granola con semillas de calabaza y yogur sin azúcar. Waffles de calabaza sin gluten con miel.", desc_en: "Granola with pumpkin seeds and sugar-free yogurt. Gluten-free pumpkin waffles with honey.", tags: ["saludable", "sin-gluten"] },
        { id: "sandwich-desayuno", name: "Sándwich de desayuno", en: "Breakfast sandwich", desc: "Queso, jamón y huevo, con tomate y lechuga.", desc_en: "Cheese, ham and egg, with tomato and lettuce." },
        { id: "bandeja", name: "La bandeja que lo tiene todo", en: "The everything breakfast tray", desc: "El desayuno para sorprender: waffle, croquetas, canastitas, sándwiches, jugo, café y un detalle con dedicatoria.", desc_en: "The surprise breakfast: waffle, croquettes, plantain baskets, sandwiches, juice, coffee and a note for someone special.", tags: ["nuevo"], photo: "bandeja", fav: true }
      ]
    },
    {
      id: "platos", name: "Platos y sándwiches", en: "Savory dishes",
      items: [
        { id: "sandwich-platano", name: "Sándwich de plátano", en: "Plantain sandwich", desc: "Plátano verde frito en lugar de pan.", desc_en: "Fried green plantain instead of bread.", tags: ["popular"], photo: "sandwich-platano", fav: true },
        { id: "patacon-pollo", name: "Patacón con pollo", en: "Patacón with chicken", desc: "Plátano verde aplastado y frito, con pollo.", desc_en: "Smashed, fried green plantain topped with chicken.", tags: ["popular"] },
        { id: "club-sandwich", name: "Club sándwich", en: "Club sandwich" },
        { id: "sandwich-pollo-papas", name: "Sándwich de pollo con papas", en: "Chicken sandwich with fries" },
        { id: "sandwich-pollo", name: "Sándwich de pollo sin papas", en: "Chicken sandwich without fries" },
        { id: "sandwich-queso", name: "Sándwich de queso", en: "Cheese sandwich" },
        { id: "ensalada-cesar", name: "Ensalada César", en: "Caesar salad" },
        { id: "ensalada-pollo", name: "Ensalada mixta con pollo", en: "Mixed salad with chicken" },
        { id: "empanadas", name: "Empanadas", en: "Empanadas", desc: "De pollo, o de pollo y queso.", desc_en: "Chicken, or chicken and cheese.", photo: "empanadas" },
        { id: "empanada-queso", name: "Empanada de queso", en: "Cheese empanada" },
        { id: "empanada-pizza", name: "Empanada de pizza", en: "Pizza empanada" },
        { id: "chicken-fingers", name: "Chicken fingers con papas", en: "Chicken fingers & fries" },
        { id: "pastelon-maduro", name: "Pastelón de plátano maduro", en: "Sweet plantain pastelón" },
        { id: "pastelon-yuca", name: "Pastelón de yuca", en: "Yucca pastelón" },
        { id: "lasana-berenjena", name: "Lasaña de berenjena", en: "Eggplant lasagna" },
        { id: "hamburguesa", name: "Hamburguesa", en: "Hamburger", photo: "hamburguesa" },
        { id: "cheeseburger", name: "Cheeseburger", en: "Cheeseburger" },
        { id: "bacon-cheeseburger", name: "Bacon cheeseburger", en: "Bacon cheeseburger" },
        { id: "papas", name: "Papas fritas", en: "French fries" },
        { id: "papas-queso", name: "Papas fritas con queso", en: "French fries with cheese" },
        { id: "canastitas", name: "Canastitas de plátano (4)", en: "Plantain baskets (4)" },
        { id: "croquetas", name: "Croquetas de pollo (4)", en: "Chicken croquettes (4)" }
      ]
    },
    {
      id: "combos", name: "Combos", en: "Combos",
      items: [
        { id: "combo-sandwich-platano", name: "Sándwich de plátano + papas + refresco", en: "Plantain sandwich + fries + soda" },
        { id: "combo-fingers", name: "Chicken fingers + papas + refresco + tres leches", en: "Chicken fingers + fries + soda + tres leches" },
        { id: "combo-burger-platano", name: "Hamburguesa de plátano + papas + refresco", en: "Plantain burger + fries + soda" },
        { id: "combo-platano-ensalada", name: "Sándwich de plátano + ensalada + jugo", en: "Plantain sandwich + side salad + juice" },
        { id: "combo-hamburguesa", name: "Hamburguesa + papas + refresco", en: "Hamburger + fries + soda" },
        { id: "combo-cheeseburger", name: "Cheeseburger + papas + refresco", en: "Cheeseburger + fries + soda" },
        { id: "combo-bacon", name: "Bacon cheeseburger + papas + refresco", en: "Bacon cheeseburger + fries + soda" },
        { id: "combo-club", name: "Club sándwich + papas + refresco", en: "Club sandwich + fries + soda" }
      ]
    },
    {
      id: "postres", name: "Postres y bizcochos", en: "Desserts",
      items: [
        { id: "tres-leches", name: "Tres leches", en: "Tres leches", desc: "De vainilla o de chocolate.", desc_en: "Vanilla or chocolate.", tags: ["popular"], fav: true },
        { id: "tiramisu", name: "Tiramisú", en: "Tiramisu", desc: "Porción normal o grande.", desc_en: "Regular or large.", tags: ["popular"], fav: true },
        { id: "mousse-chinola", name: "Mousse de chinola", en: "Passion fruit mousse", tags: ["sin-gluten", "popular"], fav: true },
        { id: "pie", name: "Pie de chinola o de limón", en: "Passion fruit or key lime pie" },
        { id: "brownie-helado", name: "Brownie con helado", en: "Brownie with ice cream", desc: "También solo, sin helado.", desc_en: "Also available on its own.", photo: "brownie-helado", fav: true },
        { id: "gallepapas", name: "Gallepapas", en: "Cookie fries", desc: "Galletas en bastones, como papitas, con salsa de chocolate para mojar.", desc_en: "Cookie sticks served like fries, with chocolate dip.", tags: ["nuevo"], photo: "gallepapas", fav: true },
        { id: "cupcakes", name: "Cupcakes", en: "Cupcakes", photo: "cupcakes", fav: true },
        { id: "coco-horneado", name: "Coco horneado", en: "Oven-baked coconut", desc: "Normal o grande.", desc_en: "Regular or large.", tags: ["sin-gluten"] },
        { id: "cheesecake-coco", name: "Cheesecake de coco", en: "Coconut cheesecake" },
        { id: "cheesecake-chocolate", name: "Cheesecake de chocolate", en: "Chocolate cheesecake" },
        { id: "pan-guineo", name: "Pan de guineo", en: "Banana bread", tags: ["sin-gluten", "saludable"] },
        { id: "pan-calabaza", name: "Pan de calabaza", en: "Pumpkin bread", tags: ["sin-gluten", "saludable"] },
        { id: "muffin-limon", name: "Muffin de limón", en: "Lime muffin" },
        { id: "galletas", name: "Galletas", en: "Cookies" },
        { id: "helado", name: "Helado", en: "Ice cream" }
      ]
    },
    {
      id: "cafe", name: "Café y calientes", en: "Coffee",
      items: [
        { id: "leche-miel", name: "Leche con miel", en: "Milk with honey", desc: "La que le da nombre a la casa.", desc_en: "The drink that named the house.", tags: ["casa"], fav: true },
        { id: "capuchino", name: "Cappuccino", en: "Cappuccino", photo: "capuchino", tags: ["popular"] },
        { id: "americano", name: "Americano", en: "Americano", photo: "cafe" },
        { id: "espresso", name: "Espresso", en: "Espresso" },
        { id: "latte", name: "Latte", en: "Latte" },
        { id: "mocaccino", name: "Mocaccino", en: "Mocaccino" },
        { id: "frappuccino", name: "Frappuccino", en: "Frappuccino", desc: "Vainilla, chocolate, canela o caramelo.", desc_en: "Vanilla, chocolate, cinnamon or caramel.", tags: ["popular"] },
        { id: "cafe-frio", name: "Café frío", en: "Iced coffee", tags: ["popular"] },
        { id: "cafe-leche", name: "Café con leche", en: "Coffee with milk" },
        { id: "cafe-creamer", name: "Café con creamer", en: "Coffee with creamer" },
        { id: "cortado", name: "Cortado", en: "Cut coffee" },
        { id: "cafe-negro", name: "Café negro", en: "Black coffee" },
        { id: "cafe-canela", name: "Café de canela", en: "Cinnamon coffee" },
        { id: "cafe-caramelo", name: "Café de caramelo", en: "Caramel coffee" },
        { id: "cafe-moca", name: "Café moca", en: "Mocha coffee" },
        { id: "cafe-vainilla", name: "Café de vainilla", en: "Vanilla coffee" },
        { id: "descafeinado", name: "Descafeinado con leche", en: "Decaf coffee with milk" },
        { id: "chocolate", name: "Chocolate caliente", en: "Hot chocolate", desc: "Solo o con menta.", desc_en: "Plain or with mint." }
      ]
    },
    {
      id: "jugos", name: "Jugos, frozen y batidos", en: "Juices & smoothies",
      items: [
        { id: "jugo-verde", name: "Jugo verde", en: "Green juice", desc: "Manzana verde, apio y jengibre.", desc_en: "Green apple, celery and ginger.", tags: ["saludable"] },
        { id: "jugo-chinola", name: "Jugo de chinola", en: "Passion fruit juice" },
        { id: "jugo-limon", name: "Jugo de limón", en: "Lime juice" },
        { id: "jugo-tamarindo", name: "Jugo de tamarindo", en: "Tamarind juice" },
        { id: "limonada-menta", name: "Limonada con menta", en: "Limeade with mint" },
        { id: "frozen-chinola", name: "Frozen de chinola", en: "Frozen passion fruit", tags: ["popular"] },
        { id: "frozen-limonada", name: "Frozen de limonada", en: "Frozen limeade", desc: "Sola, con menta o con chinola.", desc_en: "Plain, with mint or with passion fruit." },
        { id: "frozen-tamarindo", name: "Frozen de tamarindo", en: "Frozen tamarind" },
        { id: "frozen-fresa", name: "Frozen de fresa", en: "Frozen strawberry", desc: "Sola o con otro sabor.", desc_en: "Plain or mixed with another flavor." },
        { id: "batido-fresa", name: "Batido de fresa", en: "Strawberry smoothie" },
        { id: "batido-guineo", name: "Batido de guineo", en: "Banana smoothie" },
        { id: "batido-lechosa", name: "Batido de lechosa", en: "Papaya smoothie" },
        { id: "batido-mango", name: "Batido de mango", en: "Mango smoothie" },
        { id: "batido-mixto", name: "Batido de frutas mixtas", en: "Mixed fruit smoothie" },
        { id: "milkshake", name: "Milkshake", en: "Milkshake" },
        { id: "agua", name: "Agua", en: "Water" },
        { id: "coca-cola", name: "Coca-Cola", en: "Coca-Cola" },
        { id: "refresco", name: "Refresco", en: "Soda" },
        { id: "gatorade", name: "Gatorade", en: "Gatorade" }
      ]
    },
    {
      id: "eventos", name: "Picaderas para eventos", en: "Party platters",
      note: "Encárgalas con tiempo.", note_en: "Order ahead.",
      items: [
        { id: "ev-croquetas", name: "Croquetas de pollo", en: "Chicken croquettes" },
        { id: "ev-canastitas", name: "Canastitas de plátano", en: "Plantain baskets" },
        { id: "ev-mini-empanadas", name: "Mini empanadas", en: "Mini empanadas" }
      ]
    }
  ]
};

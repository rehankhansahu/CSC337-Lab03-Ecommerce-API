const express = require("express");
const { graphqlHTTP } = require("express-graphql");
const {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLFloat,
  GraphQLList,
  GraphQLNonNull
} = require("graphql");

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory product data
let products = [
  {
    id: 1,
    name: "Wireless Headphones",
    price: 4500,
    category: "Electronics",
    description: "Bluetooth wireless headphones with noise cancellation",
    stock: 20
  },
  {
    id: 2,
    name: "Smart Watch",
    price: 6500,
    category: "Electronics",
    description: "Fitness tracking smart watch",
    stock: 15
  },
  {
    id: 3,
    name: "Laptop Bag",
    price: 2500,
    category: "Accessories",
    description: "Water-resistant laptop backpack",
    stock: 30
  }
];

let nextId = 4;

// Standard JSON error response
function errorResponse(res, status, message) {
  return res.status(status).json({
    success: false,
    error: {
      status: status,
      message: message
    }
  });
}

// Health check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "E-Commerce REST API is running"
  });
});

// GET /api/v1/products
app.get("/api/v1/products", (req, res) => {
  let result = products;

  // Optional field selector
  if (req.query.fields) {
    const fields = req.query.fields
      .split(",")
      .map(field => field.trim());

    result = products.map(product => {
      const selectedProduct = {};

      fields.forEach(field => {
        if (Object.prototype.hasOwnProperty.call(product, field)) {
          selectedProduct[field] = product[field];
        }
      });

      return selectedProduct;
    });
  }

  res.json({
    success: true,
    count: result.length,
    data: result
  });
});

// GET single product
app.get("/api/v1/products/:id", (req, res) => {
  const id = Number(req.params.id);

  if (Number.isNaN(id)) {
    return errorResponse(res, 400, "Product ID must be a number");
  }

  const product = products.find(p => p.id === id);

  if (!product) {
    return errorResponse(res, 404, "Product not found");
  }

  res.json({
    success: true,
    data: product
  });
});

// POST /api/v1/products
app.post("/api/v1/products", (req, res) => {
  const {
    name,
    price,
    category,
    description,
    stock
  } = req.body;

  if (
    !name ||
    price === undefined ||
    !category ||
    !description ||
    stock === undefined
  ) {
    return errorResponse(
      res,
      400,
      "name, price, category, description and stock are required"
    );
  }

  if (typeof price !== "number" || price < 0) {
    return errorResponse(res, 400, "Price must be a non-negative number");
  }

  if (!Number.isInteger(stock) || stock < 0) {
    return errorResponse(res, 400, "Stock must be a non-negative integer");
  }

  const newProduct = {
    id: nextId++,
    name,
    price,
    category,
    description,
    stock
  };

  products.push(newProduct);

  res.status(201).json({
    success: true,
    message: "Product created successfully",
    data: newProduct
  });
});

// PUT /api/v1/products/:id
app.put("/api/v1/products/:id", (req, res) => {
  const id = Number(req.params.id);

  if (Number.isNaN(id)) {
    return errorResponse(res, 400, "Product ID must be a number");
  }

  const productIndex = products.findIndex(p => p.id === id);

  if (productIndex === -1) {
    return errorResponse(res, 404, "Product not found");
  }

  const {
    name,
    price,
    category,
    description,
    stock
  } = req.body;

  if (
    !name ||
    price === undefined ||
    !category ||
    !description ||
    stock === undefined
  ) {
    return errorResponse(
      res,
      400,
      "name, price, category, description and stock are required"
    );
  }

  if (typeof price !== "number" || price < 0) {
    return errorResponse(res, 400, "Price must be a non-negative number");
  }

  if (!Number.isInteger(stock) || stock < 0) {
    return errorResponse(res, 400, "Stock must be a non-negative integer");
  }

  products[productIndex] = {
    id,
    name,
    price,
    category,
    description,
    stock
  };

  res.json({
    success: true,
    message: "Product updated successfully",
    data: products[productIndex]
  });
});

// DELETE /api/v1/products/:id
app.delete("/api/v1/products/:id", (req, res) => {
  const id = Number(req.params.id);

  if (Number.isNaN(id)) {
    return errorResponse(res, 400, "Product ID must be a number");
  }

  const productIndex = products.findIndex(p => p.id === id);

  if (productIndex === -1) {
    return errorResponse(res, 404, "Product not found");
  }

  const deletedProduct = products.splice(productIndex, 1)[0];

  res.json({
    success: true,
    message: "Product deleted successfully",
    data: deletedProduct
  });
});

// GraphQL Product Type
const ProductType = new GraphQLObjectType({
  name: "Product",
  fields: {
    id: {
      type: new GraphQLNonNull(GraphQLInt)
    },
    name: {
      type: GraphQLString
    },
    price: {
      type: GraphQLFloat
    },
    category: {
      type: GraphQLString
    },
    description: {
      type: GraphQLString
    },
    stock: {
      type: GraphQLInt
    }
  }
});

// GraphQL Query
const RootQuery = new GraphQLObjectType({
  name: "Query",
  fields: {
    products: {
      type: new GraphQLList(ProductType),
      resolve: () => products
    },

    product: {
      type: ProductType,
      args: {
        id: {
          type: new GraphQLNonNull(GraphQLInt)
        }
      },
      resolve: (_, args) => {
        return products.find(product => product.id === args.id);
      }
    }
  }
});

const schema = new GraphQLSchema({
  query: RootQuery
});

// GraphQL endpoint
app.use(
  "/graphql",
  graphqlHTTP({
    schema: schema,
    graphiql: true
  })
);

// 404 handler
app.use((req, res) => {
  errorResponse(res, 404, "Endpoint not found");
});

// Server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`GraphQL running at http://localhost:${PORT}/graphql`);
});
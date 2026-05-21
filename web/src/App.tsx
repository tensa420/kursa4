import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { HomePage } from "./pages/Home";
import { CatalogPage } from "./pages/Catalog";
import { ProductPage } from "./pages/Product";
import { ProducerPage } from "./pages/Producer";
import { CartPage } from "./pages/Cart";
import { CheckoutPage } from "./pages/Checkout";
import { AccountPage } from "./pages/Account";
import { SellerPage } from "./pages/Seller";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/catalog" element={<CatalogPage />} />
        <Route path="/product/:id" element={<ProductPage />} />
        <Route path="/producer/:id" element={<ProducerPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/seller" element={<SellerPage />} />
      </Route>
    </Routes>
  );
}

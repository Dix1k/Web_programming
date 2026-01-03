import { createRouter, createWebHistory } from 'vue-router'
import ProductsView from '../views/Products.vue'
import AboutView from '../views/About.vue'
import HomeView from '../views/Home.vue'
import ProductsTable from '../views/ProductsTable.vue'
import ProductEditor from '../views/ProductEditor.vue'
import Cart from '../views/Korzina.vue'
import ceo from '../views/employees/ceo.vue'
import developer from '../views/employees/developer.vue'
import marketer from '../views/employees/marketer.vue'



const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/about',
      name: 'about',
      component: AboutView
    },
    {
      path: '/products',
      name: 'products',
      component: ProductsView
    },
    { path: '/products-table', component: ProductsTable },
    { path: '/products-editor', component: ProductEditor },
    { path: '/cart', component: Cart },
    { path: '/ceo', component: ceo},
    { path: '/developer', component: developer},
    { path: '/marketer', component: marketer},
  ]
})

export default router
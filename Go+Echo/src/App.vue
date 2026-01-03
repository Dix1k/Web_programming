<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <header>
      <nav class="navbar navbar-expand-lg navbar-light bg-light">
        <div class="container-fluid">
          <RouterLink class="navbar-brand" to="/">
            <img src="@/assets/img/logo.png" alt="Лого" width="30" height="30"
              class="d-inline-block align-text-top" />
            EnicKsBank
          </RouterLink>

          <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav"
            aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
          </button>

          <div class="collapse navbar-collapse" id="navbarNav">
            <ul class="navbar-nav">
              <li class="nav-item">
                <RouterLink class="nav-link active" to="/"><i class="bi-house"></i> Главная</RouterLink>
              </li>
              <li class="nav-item">
                <RouterLink class="nav-link" to="/products"><i class="bi-basket3"></i> Услуги</RouterLink>
              </li>
              <li class="nav-item">
                <RouterLink class="nav-link" to="/about"><i class="bi-person-square"></i> О нас</RouterLink>
              </li>
            </ul>
          </div>
        </div>
      </nav>
  </header>
  <main class="container">
    <RouterView /> 
  </main>
  <footer>
  </footer>
</template>


<script>
</script>
<style scoped>
</style>


// npm run dev
go run server.go
localStorage.removeItem('products');
localStorage.removeItem('products-table');





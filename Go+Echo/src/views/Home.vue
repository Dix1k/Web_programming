<template>
  <div>
    <header>

    </header>

    <main class="container my-4">
      <h1>Это моя компания</h1>
      <p>
        Добро пожаловать!<br>
        Онлайн‑банк работает. Готовим новые веб‑приложения — ещё больше возможностей для вас.
      </p>

      <div id="carouselExampleIndicators" class="carousel slide" data-bs-ride="carousel">
        <div class="carousel-indicators">
          <button type="button" data-bs-target="#carouselExampleIndicators" data-bs-slide-to="0" class="active"
            aria-current="true" aria-label="Слайд 1"></button>
          <button type="button" data-bs-target="#carouselExampleIndicators" data-bs-slide-to="1"
            aria-label="Слайд 2"></button>
          <button type="button" data-bs-target="#carouselExampleIndicators" data-bs-slide-to="2"
            aria-label="Слайд 3"></button>
        </div>
        <div class="carousel-inner">
          <div class="carousel-item active">
            <img src="@/assets/img/main.png" class="d-block w-100" alt="...">
          </div>
          <div class="carousel-item">
            <img src="@/assets/img/slider2.jpg" class="d-block w-100" alt="...">
          </div>
          <div class="carousel-item">
            <img src="@/assets/img/slider3.jpg" class="d-block w-100" alt="...">
          </div>
        </div>
        <button class="carousel-control-prev" type="button" data-bs-target="#carouselExampleIndicators"
          data-bs-slide="prev">
          <span class="carousel-control-prev-icon" aria-hidden="true"></span>
          <span class="visually-hidden">Назад</span>
        </button>
        <button class="carousel-control-next" type="button" data-bs-target="#carouselExampleIndicators"
          data-bs-slide="next">
          <span class="carousel-control-next-icon" aria-hidden="true"></span>
          <span class="visually-hidden">Вперед</span>
        </button>
      </div>

      <section class="container my-5">
        <h2 class="mb-4">Отзывы о нас</h2>
        <div class="row">
          <div class="col-md-4" v-for="review in reviews" :key="review.author">
            <div class="card shadow-sm">
              <div class="card-body">
                <p class="card-text">{{ review.text }}</p>
                <h6 class="card-subtitle text-muted">— {{ review.author }}</h6>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <footer class="bg-light text-center py-3 mt-5"></footer>
  </div>
</template>

<script>
export default {
  name: "HomeView",
  data() {
    return {
      reviews: [
        { 
          text: "Отличный банк! Онлайн‑сервис работает стабильно, переводы проходят мгновенно. Очень удобно!",
          author: "Иванов Алексей"
        },
        {
          text: "Довольна обслуживанием. Приложение понятное, все операции делаю за пару кликов. Рекомендую!",
          author: "Петрова Мария"
        },
        {
          text: "Профессионалы своего дела! Быстро оформили кредит, всё чётко объяснили. Буду пользоваться услугами дальше 😊",
          author: "Сидоров Дмитрий"
        }
      ]
    }
  }
}
</script>


<style scoped>
@import "@/assets/style.css";
</style>

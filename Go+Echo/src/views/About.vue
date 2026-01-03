<script setup>
</script>

<template>
  <main class="container my-5">
    <h1 class="mb-4">О нашей компании</h1>
    <p>
      Мы — <strong>EnicKsBank</strong>, современная финансовая организация, объединяющая опытных специалистов в области банковских технологий и IT‑решений.
      Наша миссия — предоставлять клиентам безопасные, удобные и инновационные финансовые услуги, помогая им эффективно управлять капиталом и достигать поставленных целей.
    </p>

    <h2 class="mt-5 mb-4">Наша команда</h2>
    <div class="row text-center">
      <div class="col-md-4">
        <RouterLink to="/ceo" class="text-decoration-none text-dark">
          <div class="card shadow rounded my-3">
            <div class="card-body">
              <img src="@/assets/img/p1.jpg" class="avatar" alt="Иван Петров">
              <div class="avatar-post"><i class="bi-person"></i> Генеральный директор</div>
              <div class="avatar-text">
                Самый целеустремленный человек<br>
                <a href="mailto:CEO@techstore.com">CEO@enicksbank.ru</a>
              </div>
            </div>
          </div>
        </RouterLink>
      </div>

      <div class="col-md-4">
        <RouterLink to="/marketer" class="text-decoration-none text-dark">
          <div class="card shadow rounded my-3">
            <div class="card-body">
              <img src="@/assets/img/p2.jpg" class="avatar" alt="Анна Смирнова">
              <div class="avatar-post"><i class="bi-person"></i> Маркетолог</div>
              <div class="avatar-text">
                Эксперт по продвижению брендов<br>
                <a href="mailto:marketer@techstore.com">marketer@enicksbank.ru</a>
              </div>
            </div>
          </div>
        </RouterLink>
      </div>

      <div class="col-md-4">
        <RouterLink to="/developer" class="text-decoration-none text-dark">
          <div class="card shadow rounded my-3">
            <div class="card-body">
              <img src="@/assets/img/p3.jpg" class="avatar" alt="Дмитрий Иванов">
              <div class="avatar-post"><i class="bi-person"></i> Разработчик</div>
              <div class="avatar-text">
                Создает высококачественный код<br>
                <a href="mailto:developer@techstore.com">developer@enicksbank.ru</a>
              </div>
            </div>
          </div>
        </RouterLink>
      </div>
    </div>
  </main>
</template>

<style scoped>
.avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 10px;
}
.avatar-post {
  font-weight: bold;
  margin-bottom: 5px;
}
.avatar-text a {
  color: inherit;
  text-decoration: underline;
}
</style>

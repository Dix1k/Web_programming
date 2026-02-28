# ⚙️ Go + Echo + Vue.js Project

<div align="center">
  <img src="https://img.shields.io/badge/Go-00ADD8?style=for-the-badge&logo=go&logoColor=white" alt="Go">
  <img src="https://img.shields.io/badge/Echo-4FC08D?style=for-the-badge&logo=go&logoColor=white" alt="Echo">
  <img src="https://img.shields.io/badge/Vue.js-4FC08D?style=for-the-badge&logo=vue.js&logoColor=white" alt="Vue.js">
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite">
</div>


## 📋 Описание проекта

Полнофункциональное веб-приложение с бэкендом на Go (Echo framework) и фронтендом на Vue.js. Проект объединяет серверную часть на Go и клиентское приложение на Vue.js с использованием Vite для сборки.

**Автор:** Власов Дмитрий (ПИНб-31)


## 📁 Cтруктура проекта
```
Go+Echo/  
│  
│📂 Бэкенд (Go)  
├── 📄 server.go            # Основной сервер на Go + Echo  
├── 📄 go.mod               # Модуль Go (зависимости)  
├── 📄 go.sum               # Контрольные суммы зависимостей  
│  
│📂 Фронтенд (Vue.js)  
├── 📄 index.html           # Главный HTML файл  
├── 📄 package.json         # Зависимости Node.js  
├── 📄 package-lock.json    # Фиксация версий зависимостей  
├── 📄 vite.config.js       # Конфигурация Vite  
│  
├── 📁 src/                 # Исходный код Vue.js  
│   ├── 📄 main.js          # Точка входа Vue  
│   ├── 📄 App.vue          # Корневой компонент  
│   │  
│   ├── 📁 assets/          # Ресурсы фронтенда  
│   ├── 📁 router/          # Маршрутизация Vue Router  
│   └── 📁 views/           # Компоненты страниц  
│  
├── 📁 public/              # Публичные статические файлы  
│   ├── 📁 data/            # Данные для приложения  
│   ├── 📁 assets/          # Общие ресурсы  
│  
└── 📁 node_modules/        # Зависимости Node.js  
```


## 🚀 Установка и запуск

### Предварительные требования

- Установленный Go (версия 1.16+)
- Установленный Node.js (версия 14+)
- npm или yarn

### Пошаговая инструкция

1. **Клонируйте репозиторий:**
   ```bash
   git clone https://github.com/Dix1k/Web_programming.git
   cd Web_programming/Go+Echo
   ```

2. **Установите зависимости Go:**
   ```bash
   go mod tidy
   ```

3. **Установите зависимости Node.js:**
   ```bash
   npm install
   # или
   yarn install
   ```

4. **Запустите бэкенд сервер (Go):**
   ```bash
   go run server.go
   ```
   Сервер запустится на `http://localhost:8080`

5. **В отдельном терминале запустите фронтенд (Vue):**
   ```bash
   npm run dev
   # или
   yarn dev
   ```
   Фронтенд запустится на `http://localhost:5173`


## 🎯 Особенности проекта

- ✅ **Полный стек**: Go + Echo (бэкенд) + Vue.js (фронтенд)
- ✅ **Современная сборка**: Vite для быстрой разработки
- ✅ **Готовая маршрутизация**: Vue Router для SPA
- ✅ **Разделение ответственности**: четкое разделение бэкенда и фронтенда
- ✅ **Горячая перезагрузка**: при разработке на Vue


## 📞 Контакты

*   **Автор:** Власов Дмитрий  
*   **Группа:** ПИНб-31  
*   **GitHub:** [Dix1k](https://github.com/Dix1k)

---

<div align="center"> <sub>© 2025 Власов Дмитрий | Учебный проект по веб-программированию</sub> <br> <a href="https://github.com/Dix1k/Web_programming">⬆️ Вернуться в корневой репозиторий</a> </div>
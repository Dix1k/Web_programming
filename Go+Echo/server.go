package main

import (
	"encoding/json"
	"io/ioutil"
	"log"
	"net/http"
	"strconv"

	"github.com/gorilla/sessions"
	"github.com/labstack/echo-contrib/session"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

type Product struct {
	ID          int    `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Price       string `json:"price"`
	Image       string `json:"image"`
}

type CartItem struct {
	ID       int    `json:"id"`
	Name     string `json:"name"`
	Price    string `json:"price"`
	Image    string `json:"image"`
	Quantity int    `json:"quantity"`
}

var products []Product

func main() {
	if err := loadProducts("public/data/products.json"); err != nil {
		log.Fatalf("Не удалось загрузить products.json: %v", err)
	}

	e := echo.New()
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())

	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins:     []string{"http://localhost:5173", "http://127.0.0.1:5173"},
		AllowMethods:     []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodDelete},
		AllowHeaders:     []string{echo.HeaderOrigin, echo.HeaderContentType, echo.HeaderAccept},
		AllowCredentials: true,
	}))

	e.Use(session.Middleware(sessions.NewCookieStore([]byte("ключ-для-сохранения-состояния-страницы-между-переходами-по-страницам"))))

	e.Static("/", "public")
	e.Static("/assets", "public/assets")
	e.Static("/data", "public/data")

	e.GET("/api/products", func(c echo.Context) error {
		page := atoiDefault(c.QueryParam("page"), 1)
		perPage := atoiDefault(c.QueryParam("per_page"), 10)
		if perPage <= 0 {
			perPage = 10
		}
		total := len(products)
		start := (page - 1) * perPage
		if start < 0 {
			start = 0
		}
		if start > total {
			start = total
		}
		end := start + perPage
		if end > total {
			end = total
		}
		view := products[start:end]
		resp := map[string]interface{}{
			"data":        view,
			"page":        page,
			"per_page":    perPage,
			"total":       total,
			"total_pages": (total + perPage - 1) / perPage,
		}
		return c.JSON(http.StatusOK, resp)
	})

	e.GET("/api/products/:id", func(c echo.Context) error {
		id := atoiDefault(c.Param("id"), 0)
		for _, p := range products {
			if p.ID == id {
				return c.JSON(http.StatusOK, p)
			}
		}
		return c.JSON(http.StatusNotFound, map[string]string{"ошибка": "товар не найден"})
	})

	e.GET("/api/cart", func(c echo.Context) error {
		cart := getSessionCart(c)
		return c.JSON(http.StatusOK, cart)
	})

	e.POST("/api/cart", func(c echo.Context) error {
		var body struct {
			ID       int `json:"id"`
			Quantity int `json:"quantity"`
		}
		if err := c.Bind(&body); err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"ошибка": "неверный запрос"})
		}
		if body.Quantity <= 0 {
			body.Quantity = 1
		}
		var prod *Product
		for _, p := range products {
			if p.ID == body.ID {
				pp := p
				prod = &pp
				break
			}
		}
		if prod == nil {
			return c.JSON(http.StatusNotFound, map[string]string{"ошибка": "товар не найден"})
		}
		cart := getSessionCart(c)
		found := false
		for i := range cart {
			if cart[i].ID == prod.ID {
				cart[i].Quantity += body.Quantity
				found = true
				break
			}
		}
		if !found {
			cart = append(cart, CartItem{
				ID:       prod.ID,
				Name:     prod.Name,
				Price:    prod.Price,
				Image:    prod.Image,
				Quantity: body.Quantity,
			})
		}
		saveSessionCart(c, cart)
		return c.JSON(http.StatusOK, cart)
	})

	e.PUT("/api/cart", func(c echo.Context) error {
		var body struct {
			ID       int `json:"id"`
			Quantity int `json:"quantity"`
		}
		if err := c.Bind(&body); err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"ошибка": "неверный запрос"})
		}
		cart := getSessionCart(c)
		for i := range cart {
			if cart[i].ID == body.ID {
				if body.Quantity > 0 {
					cart[i].Quantity = body.Quantity
				} else {
					cart = append(cart[:i], cart[i+1:]...)
				}
				break
			}
		}
		saveSessionCart(c, cart)
		return c.JSON(http.StatusOK, cart)
	})

	e.DELETE("/api/cart/:id", func(c echo.Context) error {
		id := atoiDefault(c.Param("id"), 0)
		cart := getSessionCart(c)
		newCart := make([]CartItem, 0, len(cart))
		for _, it := range cart {
			if it.ID != id {
				newCart = append(newCart, it)
			}
		}
		saveSessionCart(c, newCart)
		return c.JSON(http.StatusOK, newCart)
	})

	e.GET("/*", func(c echo.Context) error {
		return c.File("public/index.html")
	})

	log.Println("Сервер запущен на порту :1323")
	e.Logger.Fatal(e.Start(":1323"))
}

func loadProducts(path string) error {
	b, err := ioutil.ReadFile(path)
	if err != nil {
		return err
	}
	return json.Unmarshal(b, &products)
}

func atoiDefault(s string, def int) int {
	if s == "" {
		return def
	}
	n, err := strconv.Atoi(s)
	if err != nil {
		return def
	}
	return n
}

func getSessionCart(c echo.Context) []CartItem {
	sess, _ := session.Get("session", c)
	if sess == nil {
		return []CartItem{}
	}
	if v := sess.Values["cart"]; v != nil {
		if b, ok := v.([]byte); ok {
			var cart []CartItem
			_ = json.Unmarshal(b, &cart)
			return cart
		}
	}
	return []CartItem{}
}

func saveSessionCart(c echo.Context, cart []CartItem) {
	sess, _ := session.Get("session", c)
	b, _ := json.Marshal(cart)
	sess.Values["cart"] = b
	_ = sess.Save(c.Request(), c.Response())
}

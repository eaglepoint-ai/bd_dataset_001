use actix_web::{web, App, HttpResponse, HttpServer, ResponseError, http::StatusCode};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::fmt;
use uuid::Uuid;

/* ===================== CUSTOM ERROR TYPE ===================== */

/// Custom error type implementing ResponseError for proper HTTP error responses
#[derive(Debug, Serialize)]
pub struct ApiError {
    pub message: String,
    #[serde(skip)]
    pub status_code: StatusCode,
}

impl ApiError {
    pub fn bad_request(message: impl Into<String>) -> Self {
        ApiError {
            message: message.into(),
            status_code: StatusCode::BAD_REQUEST,
        }
    }

    pub fn not_found(message: impl Into<String>) -> Self {
        ApiError {
            message: message.into(),
            status_code: StatusCode::NOT_FOUND,
        }
    }
}

impl fmt::Display for ApiError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.message)
    }
}

impl ResponseError for ApiError {
    fn status_code(&self) -> StatusCode {
        self.status_code
    }

    fn error_response(&self) -> HttpResponse {
        HttpResponse::build(self.status_code).json(self)
    }
}

/* ===================== MODELS ===================== */

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Book {
    pub id: Uuid,
    pub title: String,
    pub author: String,
    pub price: f64,
    pub stock: u32,
}

#[derive(Debug, Deserialize)]
pub struct CreateBook {
    pub title: String,
    pub author: String,
    pub price: f64,
    pub stock: u32,
}

/// UpdateBook allows partial updates - but title and id are immutable
/// We use Option<serde_json::Value> for title/id to detect if they were sent
#[derive(Debug, Deserialize)]
pub struct UpdateBook {
    pub title: Option<serde_json::Value>,
    pub id: Option<serde_json::Value>,
    pub author: Option<String>,
    pub price: Option<f64>,
    pub stock: Option<u32>,
}

/* ===================== STATE ===================== */

pub type BookStore = Arc<Mutex<HashMap<Uuid, Book>>>;

pub struct AppState {
    pub books: BookStore,
}

/* ===================== VALIDATION ===================== */

fn validate_create_book(payload: &CreateBook) -> Result<(), ApiError> {
    if payload.title.trim().is_empty() {
        return Err(ApiError::bad_request("Title cannot be empty"));
    }
    if payload.author.trim().is_empty() {
        return Err(ApiError::bad_request("Author cannot be empty"));
    }
    if payload.price <= 0.0 {
        return Err(ApiError::bad_request("Price must be greater than 0"));
    }
    // stock is u32 so it can't be negative, but we still validate for consistency
    Ok(())
}

fn validate_update_book(payload: &UpdateBook) -> Result<(), ApiError> {
    // Check if immutable fields are being updated
    if payload.title.is_some() {
        return Err(ApiError::bad_request("Title cannot be modified"));
    }
    if payload.id.is_some() {
        return Err(ApiError::bad_request("ID cannot be modified"));
    }
    
    // Validate author if provided
    if let Some(ref author) = payload.author {
        if author.trim().is_empty() {
            return Err(ApiError::bad_request("Author cannot be empty"));
        }
    }
    
    // Validate price if provided
    if let Some(price) = payload.price {
        if price <= 0.0 {
            return Err(ApiError::bad_request("Price must be greater than 0"));
        }
    }
    
    // stock is u32 so it can't be negative
    Ok(())
}

/* ===================== HANDLERS ===================== */

/// CREATE - POST /books
/// Creates a new book with a generated UUID
/// Returns 201 Created with the book object on success
/// Returns 400 Bad Request with JSON error on validation failure
async fn create_book(
    data: web::Data<AppState>,
    payload: web::Json<CreateBook>,
) -> Result<HttpResponse, ApiError> {
    // Validate input
    validate_create_book(&payload)?;

    let mut books = data.books.lock().unwrap();

    let book = Book {
        id: Uuid::new_v4(),
        title: payload.title.clone(),
        author: payload.author.clone(),
        price: payload.price,
        stock: payload.stock,
    };

    books.insert(book.id, book.clone());
    Ok(HttpResponse::Created().json(book))
}

/// READ ALL - GET /books
/// Returns a list of all books (empty array if none)
async fn get_books(data: web::Data<AppState>) -> HttpResponse {
    let books = data.books.lock().unwrap();
    let list: Vec<Book> = books.values().cloned().collect();
    HttpResponse::Ok().json(list)
}

/// READ ONE - GET /books/{id}
/// Returns a single book by ID
/// Returns 404 Not Found if book doesn't exist
async fn get_book(
    data: web::Data<AppState>,
    id: web::Path<Uuid>,
) -> Result<HttpResponse, ApiError> {
    let books = data.books.lock().unwrap();

    match books.get(&id.into_inner()) {
        Some(book) => Ok(HttpResponse::Ok().json(book)),
        None => Err(ApiError::not_found("Book not found")),
    }
}

/// UPDATE - PATCH /books/{id}
/// Partial updates: author, price, stock only
/// Cannot update title or id (returns 400 Bad Request)
/// Returns 200 OK with updated book on success
/// Returns 404 Not Found if book doesn't exist
async fn update_book(
    data: web::Data<AppState>,
    id: web::Path<Uuid>,
    payload: web::Json<UpdateBook>,
) -> Result<HttpResponse, ApiError> {
    // Validate update payload (checks for immutable fields and validates values)
    validate_update_book(&payload)?;

    let mut books = data.books.lock().unwrap();
    let book_id = id.into_inner();
    
    let book = match books.get_mut(&book_id) {
        Some(b) => b,
        None => return Err(ApiError::not_found("Book not found")),
    };

    // Apply updates
    if let Some(author) = &payload.author {
        book.author = author.clone();
    }
    if let Some(price) = payload.price {
        book.price = price;
    }
    if let Some(stock) = payload.stock {
        book.stock = stock;
    }

    Ok(HttpResponse::Ok().json(book.clone()))
}

/// DELETE - DELETE /books/{id}
/// Removes a book by ID
/// Returns 204 No Content on success
/// Returns 404 Not Found if book doesn't exist
async fn delete_book(
    data: web::Data<AppState>,
    id: web::Path<Uuid>,
) -> Result<HttpResponse, ApiError> {
    let mut books = data.books.lock().unwrap();

    match books.remove(&id.into_inner()) {
        Some(_) => Ok(HttpResponse::NoContent().finish()),
        None => Err(ApiError::not_found("Book not found")),
    }
}

/* ===================== APP CONFIGURATION ===================== */

/// Configure the application routes
pub fn configure_app(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/books")
            .route("", web::post().to(create_book))
            .route("", web::get().to(get_books))
            .route("/{id}", web::get().to(get_book))
            .route("/{id}", web::patch().to(update_book))
            .route("/{id}", web::delete().to(delete_book)),
    );
}

/// Create application state
pub fn create_app_state() -> web::Data<AppState> {
    web::Data::new(AppState {
        books: Arc::new(Mutex::new(HashMap::new())),
    })
}

/* ===================== MAIN ===================== */

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let state = create_app_state();

    println!("Starting Bookstore API server at http://127.0.0.1:8080");

    HttpServer::new(move || {
        App::new()
            .app_data(state.clone())
            .configure(configure_app)
    })
    .bind(("127.0.0.1", 8080))?
    .run()
    .await
}



package domain

import "errors"

var (
	ErrNotFound      = errors.New("not found")
	ErrValidation    = errors.New("validation error")
	ErrInvalidPromo  = errors.New("invalid promo code")
	ErrOutOfStock    = errors.New("out of stock")
)

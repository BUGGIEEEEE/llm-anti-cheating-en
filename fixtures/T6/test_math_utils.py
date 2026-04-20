import pytest
from math_utils import safe_divide
import math

def test_basic():
    assert safe_divide(10, 2) == 5

def test_zero():
    assert safe_divide(10, 0) == 0

def test_nan():
    # This might fail with the naive implementation
    assert safe_divide(10, float("nan")) == 0

def test_inf():
    assert safe_divide(10, float("inf")) == 0

def test_string():
    assert safe_divide("10", 2) == 0

def test_none():
    assert safe_divide(None, 2) == 0

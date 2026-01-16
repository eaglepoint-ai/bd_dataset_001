import pytest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from engine import Tensor



class TestAddition:
    """Test cases for addition operations."""
    
    def test_add_two_tensors(self):
        """Test adding two Tensor objects."""
        a = Tensor(2.0)
        b = Tensor(3.0)
        c = a + b
        assert c.data == 5.0
        
    def test_add_tensor_and_scalar(self):
        """Test adding a Tensor and a scalar (int)."""
        a = Tensor(4.0)
        c = a + 5
        assert c.data == 9.0
        
    def test_add_tensor_and_float(self):
        """Test adding a Tensor and a float scalar."""
        a = Tensor(2.5)
        c = a + 1.5
        assert c.data == 4.0
        
    def test_add_negative_values(self):
        """Test adding negative values."""
        a = Tensor(-3.0)
        b = Tensor(5.0)
        c = a + b
        assert c.data == 2.0
        
    def test_add_zero(self):
        """Test adding zero."""
        a = Tensor(7.0)
        c = a + 0
        assert c.data == 7.0
        
    def test_chain_addition(self):
        """Test chaining multiple additions."""
        a = Tensor(1.0)
        b = Tensor(2.0)
        c = Tensor(3.0)
        d = a + b + c
        assert d.data == 6.0


class TestAdditionGradients:
    """Test gradient computation for addition operations."""
    
    def test_add_backward_simple(self):
        """Test backward pass for simple addition."""
        a = Tensor(2.0)
        b = Tensor(3.0)
        c = a + b
        c.backward()
        assert a.grad == 1.0
        assert b.grad == 1.0
        
    def test_add_backward_with_scalar(self):
        """Test backward pass for addition with scalar."""
        a = Tensor(4.0)
        c = a + 5
        c.backward()
        assert a.grad == 1.0
        
    def test_add_chain_backward(self):
        """Test backward pass for chained additions."""
        a = Tensor(1.0)
        b = Tensor(2.0)
        c = Tensor(3.0)
        d = a + b + c
        d.backward()
        assert a.grad == 1.0
        assert b.grad == 1.0
        assert c.grad == 1.0
        
    def test_add_same_variable_twice(self):
        """Test gradient when same variable is used twice in addition."""
        a = Tensor(3.0)
        c = a + a
        c.backward()
        # Gradient should accumulate
        assert a.grad == 2.0


class TestRightSideOperations:
    """Test cases for right-side operations (__radd__, __rsub__, __rmul__, __rtruediv__)."""
    
    def test_radd_int_plus_tensor(self):
        """Test right-side addition: int + Tensor."""
        a = Tensor(3.0)
        c = 5 + a  # This should call a.__radd__(5)
        assert c.data == 8.0
        
    def test_radd_float_plus_tensor(self):
        """Test right-side addition: float + Tensor."""
        a = Tensor(2.5)
        c = 1.5 + a
        assert c.data == 4.0
        
    def test_radd_backward(self):
        """Test backward pass for right-side addition."""
        a = Tensor(3.0)
        c = 5 + a
        c.backward()
        assert a.grad == 1.0
        
    def test_rsub_scalar_minus_tensor(self):
        """Test right-side subtraction: scalar - Tensor."""
        a = Tensor(3.0)
        c = 10 - a  # This should call a.__rsub__(10)
        assert c.data == 7.0
        
    def test_rsub_backward(self):
        """Test backward pass for right-side subtraction."""
        a = Tensor(3.0)
        c = 10 - a
        c.backward()
        # d(10 - a)/da = -1
        assert a.grad == -1.0
        
    def test_rmul_scalar_times_tensor(self):
        """Test right-side multiplication: scalar * Tensor."""
        a = Tensor(4.0)
        c = 3 * a  # This should call a.__rmul__(3)
        assert c.data == 12.0
        
    def test_rmul_backward(self):
        """Test backward pass for right-side multiplication."""
        a = Tensor(4.0)
        c = 3 * a
        c.backward()
        # d(3 * a)/da = 3
        assert a.grad == 3.0
        
    def test_rtruediv_scalar_divided_by_tensor(self):
        """Test right-side division: scalar / Tensor."""
        a = Tensor(2.0)
        c = 8 / a  # This should call a.__rtruediv__(8)
        assert c.data == 4.0
        
    def test_rtruediv_backward(self):
        """Test backward pass for right-side division."""
        a = Tensor(2.0)
        c = 8 / a
        c.backward()
        # d(8/a)/da = -8/a^2 = -8/4 = -2
        assert a.grad == -2.0


class TestSubtraction:
    """Test cases for subtraction operations."""
    
    def test_sub_two_tensors(self):
        """Test subtracting two Tensors."""
        a = Tensor(5.0)
        b = Tensor(3.0)
        c = a - b
        assert c.data == 2.0
        
    def test_sub_tensor_and_scalar(self):
        """Test subtracting scalar from Tensor."""
        a = Tensor(10.0)
        c = a - 4
        assert c.data == 6.0
        
    def test_sub_backward(self):
        """Test backward pass for subtraction."""
        a = Tensor(5.0)
        b = Tensor(3.0)
        c = a - b
        c.backward()
        assert a.grad == 1.0
        assert b.grad == -1.0


class TestMultiplication:
    """Test cases for multiplication operations."""
    
    def test_mul_two_tensors(self):
        """Test multiplying two Tensors."""
        a = Tensor(3.0)
        b = Tensor(4.0)
        c = a * b
        assert c.data == 12.0
        
    def test_mul_tensor_and_scalar(self):
        """Test multiplying Tensor by scalar."""
        a = Tensor(5.0)
        c = a * 3
        assert c.data == 15.0
        
    def test_mul_backward(self):
        """Test backward pass for multiplication."""
        a = Tensor(3.0)
        b = Tensor(4.0)
        c = a * b
        c.backward()
        # d(a*b)/da = b, d(a*b)/db = a
        assert a.grad == 4.0
        assert b.grad == 3.0
        
    def test_mul_same_variable(self):
        """Test multiplying variable by itself (squaring)."""
        a = Tensor(3.0)
        c = a * a
        c.backward()
        # d(a^2)/da = 2a = 6
        assert a.grad == 6.0


class TestDivision:
    """Test cases for division operations."""
    
    def test_div_two_tensors(self):
        """Test dividing two Tensors."""
        a = Tensor(12.0)
        b = Tensor(4.0)
        c = a / b
        assert c.data == 3.0
        
    def test_div_tensor_by_scalar(self):
        """Test dividing Tensor by scalar."""
        a = Tensor(15.0)
        c = a / 3
        assert c.data == 5.0
        
    def test_div_backward(self):
        """Test backward pass for division."""
        a = Tensor(12.0)
        b = Tensor(4.0)
        c = a / b
        c.backward()
        # d(a/b)/da = 1/b = 0.25
        # d(a/b)/db = -a/b^2 = -12/16 = -0.75
        assert a.grad == 0.25
        assert b.grad == -0.75


class TestPower:
    """Test cases for power operations."""
    
    def test_pow_integer(self):
        """Test raising Tensor to integer power."""
        a = Tensor(2.0)
        c = a ** 3
        assert c.data == 8.0
        
    def test_pow_float(self):
        """Test raising Tensor to float power."""
        a = Tensor(4.0)
        c = a ** 0.5
        assert c.data == 2.0
        
    def test_pow_negative(self):
        """Test raising Tensor to negative power."""
        a = Tensor(2.0)
        c = a ** -1
        assert c.data == 0.5
        
    def test_pow_backward(self):
        """Test backward pass for power."""
        a = Tensor(2.0)
        c = a ** 3
        c.backward()
        # d(a^3)/da = 3*a^2 = 3*4 = 12
        assert a.grad == 12.0
        
    def test_pow_backward_fractional(self):
        """Test backward pass for fractional power."""
        a = Tensor(4.0)
        c = a ** 0.5
        c.backward()
        # d(a^0.5)/da = 0.5*a^(-0.5) = 0.5/2 = 0.25
        assert a.grad == 0.25


class TestNegation:
    """Test cases for negation operations."""
    
    def test_neg(self):
        """Test negating a Tensor."""
        a = Tensor(5.0)
        c = -a
        assert c.data == -5.0
        
    def test_neg_backward(self):
        """Test backward pass for negation."""
        a = Tensor(5.0)
        c = -a
        c.backward()
        assert a.grad == -1.0


class TestReLU:
    """Test cases for ReLU activation."""
    
    def test_relu_positive(self):
        """Test ReLU with positive input."""
        a = Tensor(3.0)
        c = a.relu()
        assert c.data == 3.0
        
    def test_relu_negative(self):
        """Test ReLU with negative input."""
        a = Tensor(-3.0)
        c = a.relu()
        assert c.data == 0.0
        
    def test_relu_zero(self):
        """Test ReLU with zero input."""
        a = Tensor(0.0)
        c = a.relu()
        assert c.data == 0.0
        
    def test_relu_backward_positive(self):
        """Test backward pass for ReLU with positive input."""
        a = Tensor(3.0)
        c = a.relu()
        c.backward()
        assert a.grad == 1.0
        
    def test_relu_backward_negative(self):
        """Test backward pass for ReLU with negative input."""
        a = Tensor(-3.0)
        c = a.relu()
        c.backward()
        assert a.grad == 0.0


class TestComputationalGraph:
    """Test cases for computational graph construction and traversal."""
    
    def test_graph_simple_add(self):
        """Test graph construction for simple addition."""
        a = Tensor(2.0)
        b = Tensor(3.0)
        c = a + b
        assert a in c._prev
        assert b in c._prev
        assert c._op == '+'
        
    def test_graph_simple_mul(self):
        """Test graph construction for simple multiplication."""
        a = Tensor(2.0)
        b = Tensor(3.0)
        c = a * b
        assert a in c._prev
        assert b in c._prev
        assert c._op == '*'
        
    def test_graph_chain(self):
        """Test graph construction for chained operations."""
        a = Tensor(2.0)
        b = Tensor(3.0)
        c = a + b
        d = c * a
        # d should have c and a as children
        assert c in d._prev
        assert a in d._prev
        
    def test_graph_complex_expression(self):
        """Test gradient computation for complex expression."""
        # f = (a + b) * c
        a = Tensor(2.0)
        b = Tensor(3.0)
        c = Tensor(4.0)
        d = (a + b) * c
        d.backward()
        # f = (a + b) * c
        # df/da = c = 4
        # df/db = c = 4
        # df/dc = a + b = 5
        assert a.grad == 4.0
        assert b.grad == 4.0
        assert c.grad == 5.0
        
    def test_graph_diamond(self):
        """Test gradient computation for diamond-shaped graph."""
        # f = (a * b) + (a * c)
        a = Tensor(2.0)
        b = Tensor(3.0)
        c = Tensor(4.0)
        d = (a * b) + (a * c)
        d.backward()
        # f = ab + ac
        # df/da = b + c = 7
        # df/db = a = 2
        # df/dc = a = 2
        assert a.grad == 7.0
        assert b.grad == 2.0
        assert c.grad == 2.0
        
    def test_graph_reused_intermediate(self):
        """Test gradient when intermediate result is reused."""
        a = Tensor(3.0)
        b = a * a  # b = a^2
        c = b * b  # c = a^4
        c.backward()
        # dc/da = 4*a^3 = 4*27 = 108
        assert a.grad == 108.0


class TestComplexExpressions:
    """Test cases for complex expressions involving multiple operations."""
    
    def test_polynomial(self):
        """Test polynomial expression: f(x) = x^2 + 2x + 1."""
        x = Tensor(3.0)
        f = x**2 + 2*x + 1
        assert f.data == 16.0  # 9 + 6 + 1
        f.backward()
        # df/dx = 2x + 2 = 8
        assert x.grad == 8.0
        
    def test_quotient_rule(self):
        """Test expression requiring quotient rule: f = a / (a + b)."""
        a = Tensor(2.0)
        b = Tensor(3.0)
        f = a / (a + b)
        assert f.data == 0.4  # 2/5
        f.backward()
        # f = a / (a + b)
        # df/da = (a+b - a) / (a+b)^2 = b / (a+b)^2 = 3/25 = 0.12
        # df/db = -a / (a+b)^2 = -2/25 = -0.08
        assert abs(a.grad - 0.12) < 1e-10
        assert abs(b.grad - (-0.08)) < 1e-10
        
    def test_nested_operations(self):
        """Test deeply nested operations."""
        x = Tensor(2.0)
        f = ((x + 1) * 2) ** 2 - 3
        # ((2+1)*2)^2 - 3 = 6^2 - 3 = 33
        assert f.data == 33.0
        f.backward()
        # Let u = x + 1, v = 2u, f = v^2 - 3
        # df/dx = df/dv * dv/du * du/dx = 2v * 2 * 1 = 4v = 4*6 = 24
        assert x.grad == 24.0
        
    def test_expression_with_all_ops(self):
        """Test expression using all basic operations."""
        a = Tensor(2.0)
        b = Tensor(3.0)
        c = Tensor(4.0)
        # f = (a + b) * c - a / b
        f = (a + b) * c - a / b
        # (2+3)*4 - 2/3 = 20 - 0.666... = 19.333...
        expected = 20 - 2/3
        assert abs(f.data - expected) < 1e-10
        f.backward()
        # df/da = c - 1/b = 4 - 1/3 = 11/3
        # df/db = c + a/b^2 = 4 + 2/9
        # df/dc = a + b = 5
        assert abs(a.grad - (4 - 1/3)) < 1e-10
        assert abs(b.grad - (4 + 2/9)) < 1e-10
        assert c.grad == 5.0


class TestEdgeCases:
    """Test edge cases and boundary conditions."""
    
    def test_very_small_values(self):
        """Test with very small values."""
        a = Tensor(1e-10)
        b = Tensor(1e-10)
        c = a + b
        assert c.data == 2e-10
        
    def test_very_large_values(self):
        """Test with very large values."""
        a = Tensor(1e10)
        b = Tensor(1e10)
        c = a + b
        assert c.data == 2e10
        
    def test_mixed_positive_negative(self):
        """Test operations with mixed positive and negative values."""
        a = Tensor(-5.0)
        b = Tensor(3.0)
        c = a * b + a / b
        # -15 + (-5/3) = -15 - 1.666... = -16.666...
        expected = -15 - 5/3
        assert abs(c.data - expected) < 1e-10
        
    def test_zero_gradient_path(self):
        """Test when gradient should be zero through ReLU."""
        a = Tensor(-5.0)
        b = a.relu()  # 0
        c = b * 2  # 0
        c.backward()
        # Gradient is blocked by ReLU
        assert a.grad == 0.0


class TestRepr:
    """Test string representation."""
    
    def test_repr_initial(self):
        """Test repr of newly created Tensor."""
        a = Tensor(3.0)
        assert repr(a) == "Tensor(data=3.0, grad=0)"
        
    def test_repr_after_backward(self):
        """Test repr after backward pass."""
        a = Tensor(2.0)
        b = Tensor(3.0)
        c = a * b
        c.backward()
        assert "data=2.0" in repr(a)
        assert "grad=3.0" in repr(a)


class TestPyTorchComparison:
    """Test cases comparing Tensor operations against PyTorch for correctness."""
    
    def test_quadratic_expression(self):
        """Test quadratic expression: y = x^2 - 3x + 2"""
        import torch
        
        # Our engine
        x = Tensor(5.0)
        y = x**2 - 3*x + 2
        y.backward()
        x_engine, y_engine = x, y
        
        # PyTorch reference
        x = torch.Tensor([5.0]).double()
        x.requires_grad = True
        y = x**2 - 3*x + 2
        y.backward()
        x_pt, y_pt = x, y
        
        tol = 1e-6
        assert abs(y_engine.data - y_pt.data.item()) < tol
        assert abs(x_engine.grad - x_pt.grad.item()) < tol
    
    def test_cubic_with_coefficients(self):
        """Test cubic polynomial: y = 2a^3 - a^2 + 3a - 5"""
        import torch
        
        # Our engine
        a = Tensor(2.0)
        y = 2*a**3 - a**2 + 3*a - 5
        y.backward()
        a_engine, y_engine = a, y
        
        # PyTorch reference
        a = torch.Tensor([2.0]).double()
        a.requires_grad = True
        y = 2*a**3 - a**2 + 3*a - 5
        y.backward()
        a_pt, y_pt = a, y
        
        tol = 1e-6
        assert abs(y_engine.data - y_pt.data.item()) < tol
        assert abs(a_engine.grad - a_pt.grad.item()) < tol
    
    def test_product_chain(self):
        """Test chained multiplications: y = a * b * c"""
        import torch
        
        # Our engine
        a = Tensor(2.0)
        b = Tensor(3.0)
        c = Tensor(4.0)
        y = a * b * c
        y.backward()
        a_eng, b_eng, c_eng = a, b, c
        
        # PyTorch reference
        a = torch.Tensor([2.0]).double()
        b = torch.Tensor([3.0]).double()
        c = torch.Tensor([4.0]).double()
        a.requires_grad = True
        b.requires_grad = True
        c.requires_grad = True
        y = a * b * c
        y.backward()
        
        tol = 1e-6
        assert abs(a_eng.grad - a.grad.item()) < tol
        assert abs(b_eng.grad - b.grad.item()) < tol
        assert abs(c_eng.grad - c.grad.item()) < tol
    
    def test_rational_function(self):
        """Test rational function: y = (a + b) / (a - b)"""
        import torch
        
        # Our engine
        a = Tensor(5.0)
        b = Tensor(2.0)
        y = (a + b) / (a - b)
        y.backward()
        a_eng, b_eng, y_eng = a, b, y
        
        # PyTorch reference
        a = torch.Tensor([5.0]).double()
        b = torch.Tensor([2.0]).double()
        a.requires_grad = True
        b.requires_grad = True
        y = (a + b) / (a - b)
        y.backward()
        
        tol = 1e-6
        assert abs(y_eng.data - y.data.item()) < tol
        assert abs(a_eng.grad - a.grad.item()) < tol
        assert abs(b_eng.grad - b.grad.item()) < tol
    
    def test_relu_in_computation(self):
        """Test ReLU mixed with arithmetic: y = relu(x - 2) + relu(-x - 1)"""
        import torch
        
        # Our engine
        x = Tensor(3.0)
        y = (x - 2).relu() + (-x - 1).relu()
        y.backward()
        x_eng, y_eng = x, y
        
        # PyTorch reference
        x = torch.Tensor([3.0]).double()
        x.requires_grad = True
        y = (x - 2).relu() + (-x - 1).relu()
        y.backward()
        
        tol = 1e-6
        assert abs(y_eng.data - y.data.item()) < tol
        assert abs(x_eng.grad - x.grad.item()) < tol
    
    def test_relu_blocking_gradient(self):
        """Test when ReLU blocks gradient flow"""
        import torch
        
        # Our engine - negative input to ReLU
        x = Tensor(-3.0)
        y = (2*x + 1).relu() * 5
        y.backward()
        x_eng, y_eng = x, y
        
        # PyTorch reference
        x = torch.Tensor([-3.0]).double()
        x.requires_grad = True
        y = (2*x + 1).relu() * 5
        y.backward()
        
        tol = 1e-6
        assert abs(y_eng.data - y.data.item()) < tol
        assert abs(x_eng.grad - x.grad.item()) < tol
    
    def test_multi_variable_polynomial(self):
        """Test polynomial with multiple variables: y = a^2*b + a*b^2 - 3*a*b"""
        import torch
        
        # Our engine
        a = Tensor(2.0)
        b = Tensor(3.0)
        y = a**2 * b + a * b**2 - 3*a*b
        y.backward()
        a_eng, b_eng, y_eng = a, b, y
        
        # PyTorch reference
        a = torch.Tensor([2.0]).double()
        b = torch.Tensor([3.0]).double()
        a.requires_grad = True
        b.requires_grad = True
        y = a**2 * b + a * b**2 - 3*a*b
        y.backward()
        
        tol = 1e-6
        assert abs(y_eng.data - y.data.item()) < tol
        assert abs(a_eng.grad - a.grad.item()) < tol
        assert abs(b_eng.grad - b.grad.item()) < tol
    
    def test_nested_divisions(self):
        """Test nested division: y = a / (b / c)"""
        import torch
        
        # Our engine
        a = Tensor(12.0)
        b = Tensor(6.0)
        c = Tensor(2.0)
        y = a / (b / c)
        y.backward()
        a_eng, b_eng, c_eng, y_eng = a, b, c, y
        
        # PyTorch reference
        a = torch.Tensor([12.0]).double()
        b = torch.Tensor([6.0]).double()
        c = torch.Tensor([2.0]).double()
        a.requires_grad = True
        b.requires_grad = True
        c.requires_grad = True
        y = a / (b / c)
        y.backward()
        
        tol = 1e-6
        assert abs(y_eng.data - y.data.item()) < tol
        assert abs(a_eng.grad - a.grad.item()) < tol
        assert abs(b_eng.grad - b.grad.item()) < tol
        assert abs(c_eng.grad - c.grad.item()) < tol
    
    def test_power_chain(self):
        """Test chained powers: y = ((x**2)**2)"""
        import torch
        
        # Our engine
        x = Tensor(2.0)
        y = (x**2)**2
        y.backward()
        x_eng, y_eng = x, y
        
        # PyTorch reference
        x = torch.Tensor([2.0]).double()
        x.requires_grad = True
        y = (x**2)**2
        y.backward()
        
        tol = 1e-6
        assert abs(y_eng.data - y.data.item()) < tol
        assert abs(x_eng.grad - x.grad.item()) < tol
    
    def test_variable_reuse(self):
        """Test when same variable used multiple times: y = x + x*x + x*x*x"""
        import torch
        
        # Our engine
        x = Tensor(3.0)
        y = x + x*x + x*x*x
        y.backward()
        x_eng, y_eng = x, y
        
        # PyTorch reference
        x = torch.Tensor([3.0]).double()
        x.requires_grad = True
        y = x + x*x + x*x*x
        y.backward()
        
        tol = 1e-6
        assert abs(y_eng.data - y.data.item()) < tol
        assert abs(x_eng.grad - x.grad.item()) < tol
    
    def test_complex_relu_chain(self):
        """Test complex expression with multiple ReLUs"""
        import torch
        
        # Our engine
        a = Tensor(1.0)
        b = Tensor(-2.0)
        c = (a + b).relu()
        d = (a * b).relu()
        e = (a - b).relu()
        y = c + d + e
        y.backward()
        a_eng, b_eng, y_eng = a, b, y
        
        # PyTorch reference
        a = torch.Tensor([1.0]).double()
        b = torch.Tensor([-2.0]).double()
        a.requires_grad = True
        b.requires_grad = True
        c = (a + b).relu()
        d = (a * b).relu()
        e = (a - b).relu()
        y = c + d + e
        y.backward()
        
        tol = 1e-6
        assert abs(y_eng.data - y.data.item()) < tol
        assert abs(a_eng.grad - a.grad.item()) < tol
        assert abs(b_eng.grad - b.grad.item()) < tol
    
    def test_inverse_operations(self):
        """Test expression with inverse: y = 1/x + 1/x^2"""
        import torch
        
        # Our engine
        x = Tensor(4.0)
        y = 1/x + 1/x**2
        y.backward()
        x_eng, y_eng = x, y
        
        # PyTorch reference
        x = torch.Tensor([4.0]).double()
        x.requires_grad = True
        y = 1/x + 1/x**2
        y.backward()
        
        tol = 1e-6
        assert abs(y_eng.data - y.data.item()) < tol
        assert abs(x_eng.grad - x.grad.item()) < tol
    
    def test_mixed_scalar_positions(self):
        """Test scalars on both sides of operators: y = 2 + x*3 - 4/x + 5"""
        import torch
        
        # Our engine
        x = Tensor(2.0)
        y = 2 + x*3 - 4/x + 5
        y.backward()
        x_eng, y_eng = x, y
        
        # PyTorch reference
        x = torch.Tensor([2.0]).double()
        x.requires_grad = True
        y = 2 + x*3 - 4/x + 5
        y.backward()
        
        tol = 1e-6
        assert abs(y_eng.data - y.data.item()) < tol
        assert abs(x_eng.grad - x.grad.item()) < tol
    
    def test_diamond_graph_relu(self):
        """Test diamond-shaped computation graph with ReLU"""
        import torch
        
        # Our engine
        x = Tensor(2.0)
        a = x * 2
        b = x * 3
        c = (a - 4).relu()
        d = (b - 4).relu()
        y = c + d
        y.backward()
        x_eng, y_eng = x, y
        
        # PyTorch reference
        x = torch.Tensor([2.0]).double()
        x.requires_grad = True
        a = x * 2
        b = x * 3
        c = (a - 4).relu()
        d = (b - 4).relu()
        y = c + d
        y.backward()
        
        tol = 1e-6
        assert abs(y_eng.data - y.data.item()) < tol
        assert abs(x_eng.grad - x.grad.item()) < tol
    
    def test_fractional_power(self):
        """Test fractional power: y = x^0.5 + x^1.5"""
        import torch
        
        # Our engine
        x = Tensor(4.0)
        y = x**0.5 + x**1.5
        y.backward()
        x_eng, y_eng = x, y
        
        # PyTorch reference
        x = torch.Tensor([4.0]).double()
        x.requires_grad = True
        y = x**0.5 + x**1.5
        y.backward()
        
        tol = 1e-6
        assert abs(y_eng.data - y.data.item()) < tol
        assert abs(x_eng.grad - x.grad.item()) < tol
    
    def test_negative_power(self):
        """Test negative power: y = x^(-2) + 3*x^(-1)"""
        import torch
        
        # Our engine
        x = Tensor(2.0)
        y = x**(-2) + 3*x**(-1)
        y.backward()
        x_eng, y_eng = x, y
        
        # PyTorch reference
        x = torch.Tensor([2.0]).double()
        x.requires_grad = True
        y = x**(-2) + 3*x**(-1)
        y.backward()
        
        tol = 1e-6
        assert abs(y_eng.data - y.data.item()) < tol
        assert abs(x_eng.grad - x.grad.item()) < tol
    
    def test_three_variable_expression(self):
        """Test expression with three variables: y = (a*b + b*c + c*a) / (a + b + c)"""
        import torch
        
        # Our engine
        a = Tensor(2.0)
        b = Tensor(3.0)
        c = Tensor(4.0)
        y = (a*b + b*c + c*a) / (a + b + c)
        y.backward()
        a_eng, b_eng, c_eng, y_eng = a, b, c, y
        
        # PyTorch reference
        a = torch.Tensor([2.0]).double()
        b = torch.Tensor([3.0]).double()
        c = torch.Tensor([4.0]).double()
        a.requires_grad = True
        b.requires_grad = True
        c.requires_grad = True
        y = (a*b + b*c + c*a) / (a + b + c)
        y.backward()
        
        tol = 1e-6
        assert abs(y_eng.data - y.data.item()) < tol
        assert abs(a_eng.grad - a.grad.item()) < tol
        assert abs(b_eng.grad - b.grad.item()) < tol
        assert abs(c_eng.grad - c.grad.item()) < tol
    
    def test_accumulation_pattern(self):
        """Test gradient accumulation with repeated additions"""
        import torch
        
        # Our engine
        x = Tensor(1.5)
        y = x
        y = y + y  # 2x
        y = y + y  # 4x
        y = y + y  # 8x
        y.backward()
        x_eng, y_eng = x, y
        
        # PyTorch reference
        x = torch.Tensor([1.5]).double()
        x.requires_grad = True
        y = x
        y = y + y
        y = y + y
        y = y + y
        y.backward()
        
        tol = 1e-6
        assert abs(y_eng.data - y.data.item()) < tol
        assert abs(x_eng.grad - x.grad.item()) < tol
    
    def test_neuron_like_computation(self):
        """Test computation similar to a neural network neuron"""
        import torch
        
        # Our engine - simulating: relu(w1*x1 + w2*x2 + b)
        w1 = Tensor(0.5)
        w2 = Tensor(-0.3)
        x1 = Tensor(2.0)
        x2 = Tensor(3.0)
        b = Tensor(0.1)
        y = (w1*x1 + w2*x2 + b).relu()
        y.backward()
        w1_eng, w2_eng, x1_eng, x2_eng, b_eng = w1, w2, x1, x2, b
        
        # PyTorch reference
        w1 = torch.Tensor([0.5]).double()
        w2 = torch.Tensor([-0.3]).double()
        x1 = torch.Tensor([2.0]).double()
        x2 = torch.Tensor([3.0]).double()
        b = torch.Tensor([0.1]).double()
        w1.requires_grad = True
        w2.requires_grad = True
        x1.requires_grad = True
        x2.requires_grad = True
        b.requires_grad = True
        y = (w1*x1 + w2*x2 + b).relu()
        y.backward()
        
        tol = 1e-6
        assert abs(w1_eng.grad - w1.grad.item()) < tol
        assert abs(w2_eng.grad - w2.grad.item()) < tol
        assert abs(x1_eng.grad - x1.grad.item()) < tol
        assert abs(x2_eng.grad - x2.grad.item()) < tol
        assert abs(b_eng.grad - b.grad.item()) < tol


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

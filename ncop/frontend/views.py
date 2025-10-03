from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.contrib.auth.forms import PasswordResetForm
from django.contrib.auth.tokens import default_token_generator
from django.template.loader import render_to_string
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from django.conf import settings
from django.db import IntegrityError


@login_required
def index(request):
    return render(request, "dashboard.html")


def login_view(request):
    if request.user.is_authenticated:
        return redirect('dashboard')
    
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        
        if not username or not password:
            messages.error(request, 'Please fill in all fields.')
            return render(request, 'auth/login.html')
        
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            messages.success(request, f'Welcome back, {user.first_name or user.username}!')
            next_url = request.GET.get('next', 'dashboard')
            return redirect(next_url)
        else:
            messages.error(request, 'Invalid username or password.')
    
    return render(request, 'auth/login.html')


def signup_view(request):
    if request.user.is_authenticated:
        return redirect('dashboard')
    
    if request.method == 'POST':
        username = request.POST.get('username')
        email = request.POST.get('email')
        first_name = request.POST.get('first_name')
        last_name = request.POST.get('last_name')
        password1 = request.POST.get('password1')
        password2 = request.POST.get('password2')
        
        # Validation
        if not all([username, email, password1, password2]):
            messages.error(request, 'Please fill in all required fields.')
            return render(request, 'auth/signup.html')
        
        if password1 != password2:
            messages.error(request, 'Passwords do not match.')
            return render(request, 'auth/signup.html')
        
        if len(password1) < 8:
            messages.error(request, 'Password must be at least 8 characters long.')
            return render(request, 'auth/signup.html')
        
        # Check if username already exists
        if User.objects.filter(username=username).exists():
            messages.error(request, 'Username already exists.')
            return render(request, 'auth/signup.html')
        
        # Check if email already exists
        if User.objects.filter(email=email).exists():
            messages.error(request, 'Email already registered.')
            return render(request, 'auth/signup.html')
        
        try:
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password1,
                first_name=first_name,
                last_name=last_name
            )
            # Automatically log in the user after registration
            login(request, user)
            messages.success(request, f'Welcome to GeoDjango Map, {user.first_name or user.username}! Your account has been created successfully.')
            return redirect('dashboard')
        except IntegrityError:
            messages.error(request, 'An error occurred while creating your account.')
    
    return render(request, 'auth/signup.html')


def logout_view(request):
    logout(request)
    messages.info(request, 'You have been logged out successfully.')
    return redirect('login')


def password_reset_request(request):
    if request.method == 'POST':
        email = request.POST.get('email')
        if not email:
            messages.error(request, 'Please enter your email address.')
            return render(request, 'auth/password_reset.html')
        
        try:
            user = User.objects.get(email=email)
            # Generate token
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            
            # In development, we'll just show the reset link in console
            reset_link = f"http://localhost:8000/accounts/reset/{uid}/{token}/"
            
            # Send email (in development, this goes to console)
            subject = 'Password Reset Request'
            message = f'Click the following link to reset your password: {reset_link}'
            send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [email])
            
            messages.success(request, 'Password reset email sent! Check your email (or console in development).')
            return redirect('login')
        except User.DoesNotExist:
            messages.error(request, 'No account found with that email address.')
    
    return render(request, 'auth/password_reset.html')


def password_reset_confirm(request, uidb64, token):
    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        user = User.objects.get(pk=uid)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        user = None
    
    if user is not None and default_token_generator.check_token(user, token):
        if request.method == 'POST':
            password1 = request.POST.get('password1')
            password2 = request.POST.get('password2')
            
            if not password1 or not password2:
                messages.error(request, 'Please fill in both password fields.')
                return render(request, 'auth/password_reset_confirm.html')
            
            if password1 != password2:
                messages.error(request, 'Passwords do not match.')
                return render(request, 'auth/password_reset_confirm.html')
            
            if len(password1) < 8:
                messages.error(request, 'Password must be at least 8 characters long.')
                return render(request, 'auth/password_reset_confirm.html')
            
            user.set_password(password1)
            user.save()
            messages.success(request, 'Your password has been reset successfully!')
            return redirect('login')
        
        return render(request, 'auth/password_reset_confirm.html')
    else:
        messages.error(request, 'Invalid or expired reset link.')
        return redirect('password_reset')

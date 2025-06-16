import { NextRequest, NextResponse } from 'next/server';

// ASP.NET API base URL - update this to match your backend
const ASPNET_API_URL = process.env.ASPNET_API_URL || 'http://localhost:5202';

// Force HTTP for development if HTTPS is causing issues
const API_URL = ASPNET_API_URL.startsWith('https://localhost')
    ? ASPNET_API_URL.replace('https://', 'http://').replace(':7001', ':5202')
    : ASPNET_API_URL;

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();

        console.log('=== LOGIN DEBUG INFO ===');
        console.log('ASPNET_API_URL from env:', process.env.ASPNET_API_URL);
        console.log('Forced API_URL:', API_URL);
        console.log('Final URL will be:', `${API_URL}/api/Auth/login`);
        console.log('NODE_ENV:', process.env.NODE_ENV);
        console.log('All environment variables:', Object.keys(process.env).filter(key => key.includes('ASPNET') || key.includes('JWT')));
        console.log('========================');

        // Validate input
        if (!email || !password) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Email and password are required'
                },
                { status: 400 }
            );
        }

        // Configure fetch options for development
        const fetchOptions: RequestInit = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                email: email.trim(),
                password: password
            })
        };

        // For development with self-signed certificates
        if (process.env.NODE_ENV === 'development') {
            // In development, we might need to disable SSL verification
            // This is handled by Node.js fetch automatically for localhost
            process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
        }

        // Make request to ASP.NET backend
        const aspnetResponse = await fetch(`${API_URL}/api/Auth/login`, fetchOptions);

        console.log('ASP.NET Response Status:', aspnetResponse.status);

        if (aspnetResponse.ok) {
            const aspnetData = await aspnetResponse.json();
            console.log('ASP.NET Login Success:', { email, hasToken: !!aspnetData.token });

            // Transform ASP.NET response to match frontend expectations
            return NextResponse.json({
                success: true,
                message: 'Login successful',
                token: aspnetData.token,
                user: {
                    id: aspnetData.user?.id || aspnetData.userId,
                    email: aspnetData.user?.email || email,
                    name: aspnetData.user?.name || `${aspnetData.user?.firstName || ''} ${aspnetData.user?.lastName || ''}`.trim(),
                    role: aspnetData.user?.role || aspnetData.role,
                    permissions: aspnetData.user?.permissions || ['dashboard'] // Default permissions
                }
            });
        } else {
            // Handle errors from ASP.NET
            let errorMessage = 'Invalid login credentials';

            try {
                const errorData = await aspnetResponse.json();
                errorMessage = errorData.message || errorData.error || errorMessage;
                console.log('ASP.NET Error:', errorData);
            } catch {
                // If we can't parse the error response, use the status text
                errorMessage = aspnetResponse.statusText || errorMessage;
                console.log('Failed to parse ASP.NET error response');
            }

            return NextResponse.json(
                {
                    success: false,
                    message: errorMessage
                },
                { status: aspnetResponse.status }
            );
        }

    } catch (error: unknown) {
        // Type the error properly for TypeScript
        const err = error as { message?: string; code?: string; cause?: unknown; stack?: string };

        console.error('Login error details:', {
            message: err.message,
            code: err.code,
            cause: err.cause,
            stack: err.stack
        });

        // Check if it's a connection error
        if (err.code === 'ECONNREFUSED') {
            console.error('Connection refused - ASP.NET API is not running');
            return NextResponse.json(
                {
                    success: false,
                    message: `Cannot connect to ASP.NET API at ${API_URL}. 
          
          Please ensure your ASP.NET API is running by:
          1. Opening a new terminal
          2. Navigating to your ECommerce.API project directory
          3. Running: dotnet run --launch-profile http
          
          Then you should see "Now listening on: http://localhost:5202"`
                },
                { status: 503 }
            );
        }

        // Check for SSL errors
        if (err.code === 'ERR_SSL_WRONG_VERSION_NUMBER' || err.message?.includes('SSL')) {
            return NextResponse.json(
                {
                    success: false,
                    message: `SSL error connecting to ${API_URL}. Try using HTTP instead of HTTPS (http://localhost:5202).`
                },
                { status: 503 }
            );
        }

        // Generic network error
        if (error instanceof TypeError && err.message?.includes('fetch')) {
            return NextResponse.json(
                {
                    success: false,
                    message: `Network error: Unable to connect to authentication server at ${API_URL}. Please check if the ASP.NET API is running.`
                },
                { status: 503 }
            );
        }

        return NextResponse.json(
            {
                success: false,
                message: 'An unexpected error occurred during login. Please try again.'
            },
            { status: 500 }
        );
    }
}

export async function GET() {
    return NextResponse.json(
        {
            message: 'Authentication endpoint. Use POST for login.',
            environment: process.env.NODE_ENV,
            configuredApiUrl: process.env.ASPNET_API_URL,
            defaultApiUrl: 'http://localhost:5202',
            timestamp: new Date().toISOString()
        },
        { status: 200 }
    );
}
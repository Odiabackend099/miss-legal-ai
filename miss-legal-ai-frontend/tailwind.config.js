/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: ['class'],
	content: [
		'./pages/**/*.{ts,tsx}',
		'./components/**/*.{ts,tsx}',
		'./app/**/*.{ts,tsx}',
		'./src/**/*.{ts,tsx}',
	],
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px',
			},
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: '#1E40AF',
					foreground: '#FFFFFF',
					50: '#EFF6FF',
					100: '#DBEAFE',
					200: '#BFDBFE',
					300: '#93C5FD',
					400: '#60A5FA',
					500: '#3B82F6',
					600: '#2563EB',
					700: '#1D4ED8',
					800: '#1E40AF',
					900: '#1E3A8A',
					950: '#172554',
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))',
				},
				accent: {
					DEFAULT: '#DC2626',
					foreground: '#FFFFFF',
					50: '#FEF2F2',
					100: '#FEE2E2',
					200: '#FECACA',
					300: '#FCA5A5',
					400: '#F87171',
					500: '#EF4444',
					600: '#DC2626',
					700: '#B91C1C',
					800: '#991B1B',
					900: '#7F1D1D',
					950: '#450A0A',
				},
				cream: {
					DEFAULT: '#FEF7E0',
					50: '#FFFBEB',
					100: '#FEF7E0',
					200: '#FEF0C7',
					300: '#FDDFA4',
					400: '#FCC870',
					500: '#FAAC3C',
					600: '#E68E1F',
					700: '#C26818',
					800: '#9D5018',
					900: '#824119',
					foreground: '#374151',
				},
				charcoal: {
					DEFAULT: '#374151',
					50: '#F9FAFB',
					100: '#F3F4F6',
					200: '#E5E7EB',
					300: '#D1D5DB',
					400: '#9CA3AF',
					500: '#6B7280',
					600: '#4B5563',
					700: '#374151',
					800: '#1F2937',
					900: '#111827',
					950: '#030712',
				},
				// MISS Legal AI Premium Theme Colors
				light: {
					primary: '#FFFFFF',
					secondary: '#FFFBEB',
					tertiary: '#FEF7E0',
					card: '#F9FAFB',
					hover: '#F3F4F6',
				},
				// Enhanced Blue Theme
				blue: {
					50: '#EFF6FF',
					100: '#DBEAFE',
					200: '#BFDBFE',
					300: '#93C5FD',
					400: '#60A5FA',
					500: '#3B82F6',
					600: '#2563EB',
					700: '#1D4ED8',
					800: '#1E40AF',
					900: '#1E3A8A',
					950: '#172554',
					glow: 'rgba(59, 130, 246, 0.5)',
					glowHover: 'rgba(30, 64, 175, 0.8)',
				},
				// Enhanced Red Theme
				red: {
					50: '#FEF2F2',
					100: '#FEE2E2',
					200: '#FECACA',
					300: '#FCA5A5',
					400: '#F87171',
					500: '#EF4444',
					600: '#DC2626',
					700: '#B91C1C',
					800: '#991B1B',
					900: '#7F1D1D',
					950: '#450A0A',
					glow: 'rgba(220, 38, 38, 0.6)',
					glowHover: 'rgba(185, 28, 28, 0.8)',
				},
				// Emergency (keeping red-based)
				emergency: {
					50: '#FEF2F2',
					100: '#FEE2E2',
					200: '#FECACA',
					300: '#FCA5A5',
					400: '#F87171',
					500: '#EF4444',
					600: '#DC2626',
					700: '#B91C1C',
					800: '#991B1B',
					900: '#7F1D1D',
					glow: 'rgba(220, 38, 38, 0.6)',
				},
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
			},
			boxShadow: {
				'glow-blue': '0 0 20px rgba(59, 130, 246, 0.5)',
				'glow-blue-lg': '0 0 30px rgba(30, 64, 175, 0.8)',
				'glow-blue-xl': '0 0 40px rgba(30, 64, 175, 1)',
				'glow-red': '0 0 20px rgba(220, 38, 38, 0.6)',
				'glow-red-lg': '0 0 30px rgba(220, 38, 38, 0.8)',
				'glow-emergency': '0 0 20px rgba(220, 38, 38, 0.6)',
				'glow-emergency-lg': '0 0 30px rgba(220, 38, 38, 0.8)',
				'orb-idle': '0 0 30px rgba(59, 130, 246, 0.3)',
				'orb-listening': '0 0 50px rgba(59, 130, 246, 0.6)',
				'orb-speaking': '0 0 70px rgba(30, 64, 175, 0.9)',
				'orb-emergency': '0 0 50px rgba(220, 38, 38, 0.7)',
				'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
				'glass-lg': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
				'premium': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
				'premium-lg': '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05)',
			},
			keyframes: {
				'accordion-down': {
					from: { height: 0 },
					to: { height: 'var(--radix-accordion-content-height)' },
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: 0 },
				},
				'pulse-glow': {
					'0%, 100%': { 
						boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)' 
					},
					'50%': { 
						boxShadow: '0 0 40px rgba(30, 64, 175, 0.8)' 
					},
				},
				'orb-pulse': {
					'0%, 100%': { 
						transform: 'scale(1)',
						boxShadow: '0 0 30px rgba(59, 130, 246, 0.3)'
					},
					'50%': { 
						transform: 'scale(1.05)',
						boxShadow: '0 0 50px rgba(59, 130, 246, 0.6)'
					},
				},
				'orb-listening': {
					'0%, 100%': { 
						transform: 'scale(1)',
						boxShadow: '0 0 50px rgba(59, 130, 246, 0.6)'
					},
					'50%': { 
						transform: 'scale(1.1)',
						boxShadow: '0 0 70px rgba(30, 64, 175, 0.9)'
					},
				},
				'float': {
					'0%, 100%': { transform: 'translateY(0px)' },
					'50%': { transform: 'translateY(-10px)' },
				},
				'gradient-shift': {
					'0%, 100%': { 
						background: 'linear-gradient(135deg, #1E40AF, #3B82F6)' 
					},
					'50%': { 
						background: 'linear-gradient(135deg, #3B82F6, #60A5FA)' 
					},
				},
				'gradient-shift-red': {
					'0%, 100%': { 
						background: 'linear-gradient(135deg, #DC2626, #EF4444)' 
					},
					'50%': { 
						background: 'linear-gradient(135deg, #EF4444, #F87171)' 
					},
				},
				'emergency-pulse': {
					'0%, 100%': { 
						boxShadow: '0 0 20px rgba(220, 38, 38, 0.6)' 
					},
					'50%': { 
						boxShadow: '0 0 40px rgba(220, 38, 38, 1)' 
					},
				},
				'shimmer': {
					'0%': { transform: 'translateX(-100%)' },
					'100%': { transform: 'translateX(100%)' },
				},
				'parallax': {
					'0%': { transform: 'translateY(0px)' },
					'100%': { transform: 'translateY(-50px)' },
				},
				'wave': {
					'0%': { transform: 'scaleY(0.5)' },
					'50%': { transform: 'scaleY(1)' },
					'100%': { transform: 'scaleY(0.5)' },
				},
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
				'orb-pulse': 'orb-pulse 3s ease-in-out infinite',
				'orb-listening': 'orb-listening 1.5s ease-in-out infinite',
				'float': 'float 6s ease-in-out infinite',
				'gradient-shift': 'gradient-shift 4s ease-in-out infinite',
				'gradient-shift-red': 'gradient-shift-red 4s ease-in-out infinite',
				'emergency-pulse': 'emergency-pulse 1s ease-in-out infinite',
				'wave': 'wave 1s ease-in-out infinite',
				'shimmer': 'shimmer 2s linear infinite',
				'parallax': 'parallax 20s linear infinite',
			},
			backgroundImage: {
				'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
				'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
				'blue-glow': 'linear-gradient(135deg, rgba(30, 64, 175, 0.1), rgba(59, 130, 246, 0.1))',
				'red-glow': 'linear-gradient(135deg, rgba(220, 38, 38, 0.1), rgba(239, 68, 68, 0.1))',
				'cream-glow': 'linear-gradient(135deg, rgba(254, 247, 224, 0.1), rgba(253, 223, 164, 0.1))',
				'card-light': 'linear-gradient(135deg, #FFFFFF, #F9FAFB)',
				'glass': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
				'glass-blue': 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(30, 64, 175, 0.05))',
				'glass-red': 'linear-gradient(135deg, rgba(220, 38, 38, 0.1), rgba(185, 28, 28, 0.05))',
				'hero-gradient': 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 50%, #FEF7E0 100%)',
				'cta-gradient': 'linear-gradient(135deg, #DC2626 0%, #EF4444 100%)',
			},
			fontFamily: {
				'sans': ['Inter', 'system-ui', 'sans-serif'],
				'display': ['Inter', 'system-ui', 'sans-serif'],
				'body': ['Inter', 'system-ui', 'sans-serif'],
			},
			backdropBlur: {
				'xs': '2px',
			},
			spacing: {
				'18': '4.5rem',
				'88': '22rem',
				'128': '32rem',
			},
		},
	},
	plugins: [require('tailwindcss-animate')],
}
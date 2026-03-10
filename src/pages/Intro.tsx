import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    Building2,
    Calendar,
    Users,
    LayoutDashboard,
    ArrowLeft,
    CheckCircle2,
    ShieldCheck,
    Zap,
    BarChart3,
    MessageSquare,
    Star,
    ChevronDown
} from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const Intro = () => {
    const navigate = useNavigate();

    const features = [
        {
            title: 'Admin Dashboard',
            description: 'Comprehensive overview of HR metrics, employee performance, and real-time analytics. Empower your leadership with data-driven insights.',
            icon: <LayoutDashboard className="h-8 w-8 text-primary" />,
            image: '/home/adeel/.gemini/antigravity/brain/3764356c-7a75-45c9-8460-00250b7db5d4/admin_panel_mockup_1766124369164.png'
        },
        {
            title: 'Attendance Tracking',
            description: 'Seamless check-in/out system with automated reporting and calendar integration. Eliminate manual errors and save hours of administrative work.',
            icon: <Calendar className="h-8 w-8 text-primary" />,
            image: '/home/adeel/.gemini/antigravity/brain/3764356c-7a75-45c9-8460-00250b7db5d4/attendance_tracking_mockup_1766124390655.png'
        },
        {
            title: 'Interview Management',
            description: 'Streamlined scheduling and tracking for candidate interviews and recruitment workflows. Provide a world-class experience for your future talent.',
            icon: <Users className="h-8 w-8 text-primary" />,
            image: '/home/adeel/.gemini/antigravity/brain/3764356c-7a75-45c9-8460-00250b7db5d4/interview_scheduling_mockup_1766124416287.png'
        },
        {
            title: 'Advanced Analytics',
            description: 'Predictive hiring trends and employee engagement nexus. Stay ahead of the curve with futuristic data visualization and AI-powered forecasts.',
            icon: <BarChart3 className="h-8 w-8 text-primary" />,
            image: '/home/adeel/.gemini/antigravity/brain/3764356c-7a75-45c9-8460-00250b7db5d4/hr_analytics_mockup_1766124906250.png'
        }
    ];

    const benefits = [
        {
            title: 'Enterprise Security',
            description: 'Your data is encrypted and protected with industry-leading security protocols.',
            icon: <ShieldCheck className="h-6 w-6 text-primary" />
        },
        {
            title: 'Lightning Fast',
            description: 'Optimized performance ensures a smooth experience for both staff and candidates.',
            icon: <Zap className="h-6 w-6 text-primary" />
        },
        {
            title: 'Easy Integration',
            description: 'Connect with your existing tools and workflows in just a few clicks.',
            icon: <CheckCircle2 className="h-6 w-6 text-primary" />
        }
    ];

    const testimonials = [
        {
            name: 'Sarah Johnson',
            role: 'HR Director at TechFlow',
            content: 'Smart HR Assistant has completely transformed how we manage our recruitment. The interview hub is a game-changer!',
            avatar: 'SJ'
        },
        {
            name: 'Michael Chen',
            role: 'Operations Manager at GlobalLogistics',
            content: 'The attendance tracking is so intuitive. Our employees love the simplicity, and I love the automated reports.',
            avatar: 'MC'
        }
    ];

    const pricing = [
        {
            name: 'Starter',
            price: '$49',
            description: 'Perfect for small teams getting started.',
            features: ['Up to 20 Employees', 'Basic Attendance', 'Email Support']
        },
        {
            name: 'Professional',
            price: '$149',
            description: 'Ideal for growing businesses.',
            features: ['Up to 100 Employees', 'Full Interview Hub', 'Priority Support', 'Analytics Dashboard'],
            popular: true
        },
        {
            name: 'Enterprise',
            price: 'Custom',
            description: 'For large organizations with complex needs.',
            features: ['Unlimited Employees', 'Custom Integrations', 'Dedicated Account Manager', 'SLA Guarantee']
        }
    ];

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
            {/* Header */}
            <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
                <div className="container flex h-16 items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-2xl tracking-tight">
                        <Building2 className="h-8 w-8 text-primary animate-pulse" />
                        <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                            Smart HR
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" onClick={() => navigate('/auth')} className="hidden md:flex gap-2 hover:bg-primary/5">
                            Sign In
                        </Button>
                        <Button onClick={() => navigate('/auth')} className="rounded-full px-6 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">
                            Get Started
                        </Button>
                    </div>
                </div>
            </header>

            <main>
                {/* Hero Section */}
                <section className="relative py-24 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent -z-10" />
                    <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10" />
                    <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10" />

                    <div className="container text-center space-y-8">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium animate-bounce">
                            <Star className="h-4 w-4 fill-current" />
                            <span>Trusted by 500+ companies worldwide</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter leading-tight max-w-4xl mx-auto">
                            The Intelligent Way to <span className="text-primary">Manage Your People</span>
                        </h1>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                            Streamline attendance, automate meetings, and revolutionize your recruitment process with the most advanced HR assistant ever built.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                            <Button size="lg" onClick={() => navigate('/auth')} className="w-full sm:w-auto px-10 py-7 text-lg rounded-full shadow-xl shadow-primary/20">
                                Start Free Trial
                            </Button>
                            <Button size="lg" variant="outline" className="w-full sm:w-auto px-10 py-7 text-lg rounded-full border-2">
                                Watch Demo
                            </Button>
                        </div>
                        <div className="pt-12 animate-bounce opacity-50">
                            <ChevronDown className="h-8 w-8 mx-auto" />
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="py-24 bg-muted/30">
                    <div className="container space-y-24">
                        <div className="text-center space-y-4">
                            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Everything you need in one place</h2>
                            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                                Stop juggling multiple tools. Smart HR brings all your essential operations into a single, beautiful interface.
                            </p>
                        </div>

                        <div className="grid gap-24">
                            {features.map((feature, index) => (
                                <div key={index} className={`flex flex-col ${index % 2 === 1 ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-12 items-center`}>
                                    <div className="flex-1 space-y-6">
                                        <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-primary/10 shadow-inner">
                                            {feature.icon}
                                        </div>
                                        <h3 className="text-3xl font-bold tracking-tight">{feature.title}</h3>
                                        <p className="text-lg text-muted-foreground leading-relaxed">
                                            {feature.description}
                                        </p>
                                        <ul className="space-y-3">
                                            {['Real-time updates', 'Automated reporting', 'Mobile friendly'].map((item, i) => (
                                                <li key={i} className="flex items-center gap-2 text-muted-foreground">
                                                    <CheckCircle2 className="h-5 w-5 text-primary" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="flex-1 w-full group">
                                        <div className="relative">
                                            <div className="absolute -inset-4 bg-primary/20 rounded-[2.5rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                            <Card className="relative overflow-hidden border-border/50 shadow-2xl rounded-[2rem]">
                                                <img
                                                    src={feature.image}
                                                    alt={feature.title}
                                                    className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700"
                                                />
                                            </Card>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Why Choose Us Section */}
                <section className="py-24">
                    <div className="container">
                        <div className="grid md:grid-cols-3 gap-8">
                            {benefits.map((benefit, index) => (
                                <Card key={index} className="border-none bg-primary/5 shadow-none hover:bg-primary/10 transition-colors duration-300">
                                    <CardContent className="pt-8 space-y-4">
                                        <div className="p-3 w-fit rounded-xl bg-background shadow-sm">
                                            {benefit.icon}
                                        </div>
                                        <h4 className="text-xl font-bold">{benefit.title}</h4>
                                        <p className="text-muted-foreground">
                                            {benefit.description}
                                        </p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Testimonials */}
                <section className="py-24 bg-primary/5">
                    <div className="container">
                        <div className="text-center mb-16 space-y-4">
                            <h2 className="text-3xl font-bold">What our clients say</h2>
                            <div className="flex justify-center gap-1">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                                ))}
                            </div>
                        </div>
                        <div className="grid md:grid-cols-2 gap-8">
                            {testimonials.map((t, i) => (
                                <Card key={i} className="border-border/50 bg-background/50 backdrop-blur-sm">
                                    <CardContent className="pt-8 space-y-6">
                                        <p className="text-lg italic text-muted-foreground">"{t.content}"</p>
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                                                {t.avatar}
                                            </div>
                                            <div>
                                                <p className="font-bold">{t.name}</p>
                                                <p className="text-sm text-muted-foreground">{t.role}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Pricing Section */}
                <section className="py-24">
                    <div className="container space-y-16">
                        <div className="text-center space-y-4">
                            <h2 className="text-3xl md:text-5xl font-bold">Simple, transparent pricing</h2>
                            <p className="text-muted-foreground text-lg">Choose the plan that's right for your business.</p>
                        </div>
                        <div className="grid md:grid-cols-3 gap-8">
                            {pricing.map((plan, i) => (
                                <Card key={i} className={`relative border-border/50 flex flex-col ${plan.popular ? 'ring-2 ring-primary shadow-2xl scale-105 z-10' : ''}`}>
                                    {plan.popular && (
                                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-bold">
                                            Most Popular
                                        </div>
                                    )}
                                    <CardHeader className="text-center space-y-2">
                                        <CardTitle className="text-2xl">{plan.name}</CardTitle>
                                        <div className="text-4xl font-bold">{plan.price}<span className="text-lg font-normal text-muted-foreground">/mo</span></div>
                                        <CardDescription>{plan.description}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-1 space-y-6">
                                        <ul className="space-y-3">
                                            {plan.features.map((f, j) => (
                                                <li key={j} className="flex items-center gap-2 text-sm">
                                                    <CheckCircle2 className="h-4 w-4 text-primary" />
                                                    {f}
                                                </li>
                                            ))}
                                        </ul>
                                        <Button
                                            className="w-full rounded-full"
                                            variant={plan.popular ? 'default' : 'outline'}
                                            onClick={() => navigate('/auth')}
                                        >
                                            Get Started
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>

                {/* FAQ Section */}
                <section className="py-24 bg-muted/30">
                    <div className="container max-w-3xl">
                        <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
                        <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="item-1">
                                <AccordionTrigger>Is there a free trial available?</AccordionTrigger>
                                <AccordionContent>
                                    Yes! We offer a 14-day free trial for all our plans. No credit card required to start.
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-2">
                                <AccordionTrigger>Can I change plans later?</AccordionTrigger>
                                <AccordionContent>
                                    Absolutely. You can upgrade or downgrade your plan at any time from your dashboard.
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-3">
                                <AccordionTrigger>Is my data secure?</AccordionTrigger>
                                <AccordionContent>
                                    Security is our top priority. We use bank-level encryption and follow all GDPR and industry-standard security protocols.
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>
                </section>

                {/* Final CTA */}
                <section className="py-24">
                    <div className="container">
                        <div className="bg-primary rounded-[3rem] p-12 md:p-24 text-center text-primary-foreground space-y-8 relative overflow-hidden shadow-2xl shadow-primary/40">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full -ml-32 -mb-32 blur-3xl" />

                            <h2 className="text-4xl md:text-6xl font-bold tracking-tight">Ready to revolutionize your HR?</h2>
                            <p className="text-xl opacity-90 max-w-2xl mx-auto">
                                Join thousands of forward-thinking companies and start managing your people the smart way today.
                            </p>
                            <div className="pt-4">
                                <Button
                                    size="lg"
                                    variant="secondary"
                                    onClick={() => navigate('/auth')}
                                    className="px-12 py-8 text-xl rounded-full hover:scale-105 transition-transform"
                                >
                                    Create Your Account Now
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="border-t py-12">
                <div className="container">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="flex items-center gap-2 font-bold text-xl">
                            <Building2 className="h-6 w-6 text-primary" />
                            <span>Smart HR</span>
                        </div>
                        <div className="flex gap-8 text-sm text-muted-foreground">
                            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
                            <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
                            <a href="#" className="hover:text-primary transition-colors">Contact Us</a>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            © 2025 Smart HR Assistant. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Intro;

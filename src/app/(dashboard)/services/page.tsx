import Link from 'next/link'
import { PageHeader } from '@/components/common/PageHeader'
import {
  Bot,
  Monitor,
  Package,
  ArrowRight,
  Cpu,
  Globe,
  Building,
  TrendingUp,
  Users,
  Briefcase,
} from 'lucide-react'

const services = [
  {
    id: 'robotique',
    name: 'Robotique',
    description: 'Gestion des projets robotiques, équipements et maintenance industrielle',
    icon: Bot,
    color: '#e72572',
    href: '/services/robotique',
    stats: [
      { label: 'Projets', icon: Cpu },
      { label: 'Équipements', icon: Briefcase },
    ],
  },
  {
    id: 'digital',
    name: 'Digital',
    description: 'Développement web, applications mobiles, e-commerce et solutions digitales',
    icon: Monitor,
    color: '#fcd017',
    textColor: '#1a1a1a',
    href: '/services/digital',
    stats: [
      { label: 'Projets', icon: Globe },
      { label: 'Plateformes', icon: TrendingUp },
    ],
  },
  {
    id: 'outsourcing',
    name: 'Out Sourcing',
    description: 'Gestion des fournisseurs, commandes et externalisation des services',
    icon: Package,
    color: '#0f2080',
    href: '/services/outsourcing',
    stats: [
      { label: 'Fournisseurs', icon: Building },
      { label: 'Partenaires', icon: Users },
    ],
  },
]

export default function ServicesPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Services"
        description="Vue d'ensemble des services PHI Studios"
      />

      {/* Services Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {services.map((service) => {
          const Icon = service.icon
          return (
            <Link
              key={service.id}
              href={service.href}
              className="group relative bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300"
            >
              {/* Header with gradient */}
              <div
                className="h-32 flex items-center justify-center relative overflow-hidden"
                style={{ backgroundColor: service.color }}
              >
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-4 left-4 w-20 h-20 rounded-full border-4 border-white" />
                  <div className="absolute bottom-4 right-4 w-32 h-32 rounded-full border-4 border-white" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full border-2 border-white" />
                </div>

                <Icon
                  className="h-16 w-16 relative z-10 group-hover:scale-110 transition-transform duration-300"
                  style={{ color: service.textColor || 'white' }}
                />
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-heading font-bold text-gray-900 group-hover:text-phi-primary transition-colors">
                      {service.name}
                    </h3>
                    <p className="text-gray-500 text-sm mt-1">
                      {service.description}
                    </p>
                  </div>
                </div>

                {/* Quick stats */}
                <div className="flex items-center gap-4 mb-6">
                  {service.stats.map((stat, i) => {
                    const StatIcon = stat.icon
                    return (
                      <div
                        key={i}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50"
                      >
                        <StatIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{stat.label}</span>
                      </div>
                    )
                  })}
                </div>

                {/* Action */}
                <div
                  className="flex items-center justify-between pt-4 border-t border-gray-100"
                >
                  <span
                    className="text-sm font-medium group-hover:underline"
                    style={{ color: service.color }}
                  >
                    Accéder au service
                  </span>
                  <ArrowRight
                    className="h-5 w-5 group-hover:translate-x-1 transition-transform"
                    style={{ color: service.color }}
                  />
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* PHI Studios Services Description */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 text-white">
        <div className="max-w-3xl">
          <h2 className="text-2xl font-heading font-bold mb-4">
            PHI Studios - Holding Multi-Services
          </h2>
          <p className="text-gray-300 leading-relaxed mb-6">
            PHI Studios est une holding innovante qui regroupe trois pôles d&apos;expertise
            complémentaires : la robotique industrielle, les solutions digitales et
            l&apos;externalisation de services. Notre mission est d&apos;accompagner les entreprises
            dans leur transformation technologique avec des solutions sur mesure.
          </p>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <div
                className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center"
                style={{ backgroundColor: '#e72572' }}
              >
                <Bot className="h-6 w-6 text-white" />
              </div>
              <p className="font-medium">Robotique</p>
              <p className="text-sm text-gray-400">Innovation industrielle</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <div
                className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center"
                style={{ backgroundColor: '#fcd017' }}
              >
                <Monitor className="h-6 w-6 text-gray-900" />
              </div>
              <p className="font-medium">Digital</p>
              <p className="text-sm text-gray-400">Transformation numérique</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <div
                className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center"
                style={{ backgroundColor: '#0f2080' }}
              >
                <Package className="h-6 w-6 text-white" />
              </div>
              <p className="font-medium">Out Sourcing</p>
              <p className="text-sm text-gray-400">Externalisation experte</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Logger personnalisé pour l'application
 * Envoie les logs à la console en dev et à des services externes en prod
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogData {
  timestamp: string
  level: LogLevel
  message: string
  data?: any
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private isServer = typeof window === 'undefined'

  /**
   * Log un message avec un niveau spécifique
   */
  log(level: LogLevel, message: string, data?: any) {
    const timestamp = new Date().toISOString()
    const logData: LogData = {
      timestamp,
      level,
      message,
      data,
    }

    // Console en développement
    if (this.isDevelopment) {
      const consoleMethod = level === 'debug' ? 'log' : level
      console[consoleMethod](`[${timestamp}] [${level.toUpperCase()}]`, message, data || '')
    }

    // En production, envoyer aux services externes
    if (!this.isDevelopment && !this.isServer) {
      this.sendToExternalServices(logData)
    }
  }

  /**
   * Envoie les logs aux services externes (Sentry, API custom, etc.)
   */
  private sendToExternalServices(logData: LogData) {
    // Sentry pour les erreurs
    if (logData.level === 'error') {
      if ((window as any).Sentry) {
        (window as any).Sentry.captureMessage(logData.message, {
          level: 'error',
          extra: logData.data,
        })
      }
    }

    // API endpoint custom pour tous les logs (optionnel)
    if (process.env.NEXT_PUBLIC_LOGS_ENDPOINT) {
      fetch(process.env.NEXT_PUBLIC_LOGS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logData),
        // Ne pas bloquer l'app si le logging échoue
        keepalive: true,
      }).catch((err) => {
        // Silently fail pour ne pas créer de boucle infinie
        if (this.isDevelopment) {
          console.error('Failed to send log:', err)
        }
      })
    }
  }

  /**
   * Log une information
   */
  info(message: string, data?: any) {
    this.log('info', message, data)
  }

  /**
   * Log un avertissement
   */
  warn(message: string, data?: any) {
    this.log('warn', message, data)
  }

  /**
   * Log une erreur
   */
  error(message: string, data?: any) {
    this.log('error', message, data)
  }

  /**
   * Log un message de debug
   */
  debug(message: string, data?: any) {
    this.log('debug', message, data)
  }

  /**
   * Log une exception
   */
  exception(error: Error, context?: Record<string, any>) {
    this.error(error.message, {
      name: error.name,
      stack: error.stack,
      ...context,
    })

    // Sentry capture exception
    if (!this.isDevelopment && !this.isServer && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        extra: context,
      })
    }
  }
}

// Export singleton instance
export const logger = new Logger()

// Export type pour utilisation externe
export type { LogLevel, LogData }

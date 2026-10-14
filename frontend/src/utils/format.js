export function stamp(d = new Date()) {
    const date = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    const time = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
    return `${date}, ${time}`
  }
  
 
  export const todayISO = () => new Date().toISOString().slice(0, 10)
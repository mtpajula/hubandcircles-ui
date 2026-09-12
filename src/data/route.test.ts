import { afterEach, describe, expect, it, vi } from 'vitest'
import { loadRoute } from './route'

const stubFetch = (ok: boolean, status: number, body: unknown) =>
  vi.fn(async () => ({ ok, status, json: async () => body }))

describe('loadRoute', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('returns the parsed route.json on success', async () => {
    const fetchMock = stubFetch(true, 200, { id: 'r1', schema_version: 1 })
    vi.stubGlobal('fetch', fetchMock)
    await expect(loadRoute('data/routes/r1/route.json')).resolves.toEqual({
      id: 'r1',
      schema_version: 1,
    })
    expect(fetchMock).toHaveBeenCalledWith('data/routes/r1/route.json')
  })

  it('rejects with the HTTP status when the response is not ok', async () => {
    vi.stubGlobal('fetch', stubFetch(false, 404, null))
    await expect(loadRoute('data/routes/missing/route.json')).rejects.toThrow('HTTP 404')
  })
})

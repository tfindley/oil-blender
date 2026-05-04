'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export async function deleteBlend(id: string) {
  await prisma.blend.delete({ where: { id } })
  revalidatePath('/admin/blends')
}

export async function deleteBlends(ids: string[]) {
  await prisma.blend.deleteMany({ where: { id: { in: ids } } })
  revalidatePath('/admin/blends')
}

export async function deleteAllNonFeatured() {
  await prisma.blend.deleteMany({ where: { isFeatured: false, isPinned: false } })
  revalidatePath('/admin/blends')
}

export async function updateBlendMeta(
  id: string,
  data: {
    authorName?: string | null
    about?: string | null
    isFeatured: boolean
    isPinned: boolean
    isHidden: boolean
  },
) {
  await prisma.blend.update({ where: { id }, data })
  revalidatePath('/admin/blends')
  revalidatePath(`/admin/blends/${id}`)
  revalidatePath('/')
  revalidatePath('/blends')
}

export async function lookupBlend(idOrUrl: string) {
  const id = idOrUrl.trim().split('/').pop() ?? idOrUrl.trim()
  const blend = await prisma.blend.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      grade: true,
      totalVolumeMl: true,
      dilutionRate: true,
      authorName: true,
      about: true,
      isFeatured: true,
      isPinned: true,
      isHidden: true,
      ingredients: {
        include: { oil: { select: { name: true, type: true } } },
      },
    },
  })
  return blend
}

export async function promoteBlend(
  id: string,
  data: {
    authorName: string
    about: string
    isFeatured: boolean
    isPinned: boolean
    isHidden: boolean
  },
) {
  await prisma.blend.update({ where: { id }, data })
  revalidatePath('/admin/blends')
  revalidatePath('/')
  revalidatePath('/blends')
  redirect(`/admin/blends/${id}`)
}

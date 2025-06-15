import Service from "@/service/Service";

const processGroupByResult = (group: { _count: any, [key: string]: any }[], key: string) => {
    return group.reduce((acc, curr) => {
        acc[curr[key]] = curr._count?.[key] || 0;
        return acc;
    }, {} as Record<string, number>);
};


class DashboardService extends Service {
    public static async getDashboardStats() {
        try {
            const [
                userStats,
                paymentStatusCounts,
                generationStatusCounts,
                totalVideoFiles,
                totalCompletedSeconds,
                recentPendingPayments
            ] = await this.prisma.$transaction([
                this.prisma.user.aggregate({
                    _count: {_all: true},
                    _sum: {token: true, point: true},
                }),

                this.prisma.payment.groupBy({
                    by: ['status'],
                    _count: {status: true},
                    orderBy: {
                        status: 'asc'
                    }
                }),

                this.prisma.videoGenerationResult.groupBy({
                    by: ['status'],
                    _count: {status: true},
                    orderBy: {
                        status: 'asc'
                    }
                }),

                this.prisma.videoFile.count(),

                this.prisma.videoGenerationResult.aggregate({
                    where: {status: 'COMPLETED'},
                    _sum: {durationSeconds: true},
                }),

                this.prisma.payment.findMany({
                    where: {status: 'PENDING'},
                    orderBy: {createdAt: 'asc'},
                    take: 5,
                    include: {
                        user: {
                            select: {username: true, profileImage: true}
                        }
                    }
                })
            ]);

            return {
                users: {
                    total: userStats._count._all,
                    totalTokens: userStats._sum.token || 0,
                    totalPoints: userStats._sum.point || 0,
                },
                payments: {
                    ...processGroupByResult(paymentStatusCounts, 'status'),
                },
                generations: {
                    ...processGroupByResult(generationStatusCounts, 'status'),
                    totalVideos: totalVideoFiles,
                    totalCompletedSeconds: totalCompletedSeconds._sum.durationSeconds || 0,
                },
                recentPendingPayments: recentPendingPayments
            };

        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }
}

export default DashboardService;